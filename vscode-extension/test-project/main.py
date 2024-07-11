# (C) 2023 Artur Andrzejak

import datetime
from utils import *
from xlsxwriter import Workbook
# import polars as pl



def prepare_budget_data(budget_daten):
    # Given a dataframe budget_daten with columns like this:
    # Label	Name_Budgetheft	Erläuterung	2020	2021	2022	2023 2024 2025 ...
    # It creates a new dataframe budget_df s.t.
    # 1. for each non-null or non-empty value in the column 'Label' there  a column named like this value,
    # 2. budget_df has corresponding to each year found as column name of budget_daten
    # 3. the values in budget_df are the values from budget_daten

    # First, get the years from the column names
    years = [str(year) for year in budget_daten.columns if year.isnumeric()]

    # retain only numeric year columns with non-null values, with at least one numeric value > 0
    years = [year for year in years if check_column_for_valid_numeric_values(budget_daten, year)]
    # print("Remaining years: " + str(years))

    # Second, get the rows with non-null or non-empty values in column 'Label'
    # and create a new dataframe with these rows
    budget_daten = budget_daten.drop_nulls(CN.label).filter(pl.col(CN.label) != '')
    # print(budget_daten)

    # Extract the relevant columns from the input dataframe
    relevant_columns = [CN.label] + years
    budget_daten = budget_daten.select(relevant_columns)

    # Melt the dataframe to transform it from wide to long format
    melted_data = budget_daten.melt(id_vars=CN.label, value_vars=years, variable_name=CN.jahr, value_name=CN.betrag)

    # Change the type of column CN.jahr from string to int
    melted_data = melted_data.with_columns(pl.col(CN.jahr).cast(pl.Int64))

    return melted_data


def prepare_bilanz_data(bilanz_daten):
    # Remove all rows with null values in column CN.jahr
    # Note: data in lines labeled 'schoepfung' is sufficient to calculate the aversen with schoepfung, so we have
    # some redundancy in the data
    bilanz_daten = bilanz_daten.drop_nulls(CN.jahr).filter(pl.col(CN.jahr) > 0)
    return bilanz_daten


def calculate_aversen(jahres_daten, aversen_daten, max_year=None):
    # Calculate aversen

    # max_year: if None, get the current year
    max_year = datetime.datetime.now().year if max_year is None else max_year

    # Get the types of Stellen from column names (e.g. 'E6' from 'Wert_E6')
    stellentypes = filter_strings_by_prefix(jahres_daten.columns, CN.prefix_wert)


    aversen = aversen_daten
    # Drop all years greater than max_year
    aversen = aversen.filter(aversen[CN.jahr] <= max_year)

    # Join with jahres_daten and replace null values with 0
    aversen_ext = aversen.join(jahres_daten, on=CN.jahr, how="inner").fill_null(0)

    # Calculate Stellenwert_Gesamt and add as new column
    aversen_ext = aversen_ext.with_columns_seq(   # use with_columns_seq otherwise list comprehension is not working
        sum([pl.col(CN.prefix_anzahl+stellentype)*pl.col(CN.prefix_wert+stellentype) for stellentype in stellentypes]).alias(CN.stellenwert_gesamt)
    )

    # Calculate the Abzug columns and add as new columns
    aversen_ext = aversen_ext.with_columns(
        (-pl.col(CN.aversum_brutto) * pl.col(CN.struktur_prozent)).alias(CN.abzug_strukt_aversum),
        (-pl.col(CN.aversum_brutto) * pl.col(CN.landesm_prozent)).alias(CN.abzug_landesm_aversum),
        (-pl.col(CN.stellenwert_gesamt) * pl.col(CN.struktur_prozent)).alias(CN.abzug_strukt_stellen),
        (-pl.col(CN.stellenwert_gesamt) * pl.col(CN.landesm_prozent)).alias(CN.abzug_landesm_stellen),
    )

    abzugcolumns = filter_strings_by_prefix(aversen_ext.columns, CN.prefix_abzug)
    # Calculate Abzug_Total
    aversen_ext = aversen_ext.with_columns_seq(
        sum([pl.col(CN.prefix_abzug+abzugtype) for abzugtype in abzugcolumns]).alias(CN.abzug_total),
    )

    # Calculate Zuschuss_IfI
    # Rule is: if CN.target_zuschuss is not 0, then use it, otherwise use CN.Target_Netto, otherwise set 0
    aversen_ext = aversen_ext.with_columns(
        pl.when(pl.col(CN.target_zuschuss) > 0.0)
        .then(pl.col(CN.target_zuschuss))           # using target_zuschuss
        .when(pl.col(CN.target_netto) > 0.0)
        .then(pl.col(CN.target_netto)-(pl.col(CN.aversum_brutto) + pl.col(CN.abzug_total)))      # using target_netto
        .otherwise(0.0)
        .alias(CN.zuschuss_ifi)
    )

    # Calculate Aversum_Netto
    aversen_ext = aversen_ext.with_columns(
        (pl.col(CN.aversum_brutto) + pl.col(CN.abzug_total) + pl.col(CN.zuschuss_ifi)).alias(CN.netto_aversum),
    )

    # Calculate Jahreszufluss
    aversen_ext = aversen_ext.with_columns(
        (pl.col(CN.schoepfung1) + pl.col(CN.schoepfung2) + pl.col(CN.einmalzahlung1)
         + pl.col(CN.netto_aversum)).alias(CN.jahreszufluss),
    )

    aversen_ext = aversen_ext.with_columns(
        (pl.col(CN.rest_vorjahr) + pl.col(CN.jahreszufluss)).alias(CN.jahresbudget),
    )


    # remove all columns got from jahres_daten, but keep Jahr
    aversen_ext = aversen_ext.drop(CN.struktur_prozent, CN.landesm_prozent, CN.target_netto, CN.target_zuschuss,
                                   *[CN.prefix_wert+stellentype for stellentype in stellentypes])
    # print("Columns which remained in  aversen_ext", aversen_ext.columns)
    # print("Comment columns: ", aversen_ext.select('Kommentar_1') )

    # reorder columns
    num_cols_before = len(aversen_ext.columns)
    aversen_ext = aversen_ext.select([
        CN.jahr, CN.einheit, CN.jahresbudget,  CN.rest_vorjahr, CN.jahreszufluss,
        CN.netto_aversum, CN.schoepfung1, CN.schoepfung2, CN.einmalzahlung1,
        CN.aversum_brutto, CN.abzug_total, CN.zuschuss_ifi,
        CN.abzug_strukt_aversum, CN.abzug_landesm_aversum, CN.abzug_strukt_stellen, CN.abzug_landesm_stellen,
        CN.stellenwert_gesamt,
        CN.prefix_anzahl+stellentypes[0], CN.prefix_anzahl+stellentypes[1], CN.prefix_anzahl+stellentypes[2],
        CN.kommentar_1, CN.kommentar_2, CN.kommentar_3
        ])
    num_cols_after = len(aversen_ext.columns)
    assert num_cols_before == num_cols_after, "Number of columns changed during reordering of aversen_ext!"

    return aversen_ext


def calculate_budget_ifi(budget_df, bilanz_df, aversen_df):
    # First, for each value in column CN.label of budget_df, create a column with this value as name
    # and the numbers from column CN.betrag as values
    ifi_budget = budget_df.pivot(
        index=CN.jahr,
        columns=CN.label,
        values=CN.betrag,
        aggregate_function=None     # no aggregation takes place, will raise error if multiple values are in group
    )

    # Second, compute CN.netto_laufende_mittel =
    #       CN.formelbudget + CN.laufende_mittel + CN.strukturbeitrag + CN.landesminus + CN.flaechenbudgetierung
    ifi_budget = ifi_budget.with_columns(
        (pl.col(CN.formelbudget) + pl.col(CN.laufende_mittel) + pl.col(CN.strukturbeitrag) + pl.col(CN.landesminus)
            + pl.col(CN.flaechenbudgetierung)).alias(CN.netto_laufende_mittel)
        )

    # Third, compute column kosten_stellen (take from bilanz_df and rename CN.betrag to CN.kosten_stellen)
    # Assume only one row per year and label CN.kosten_stellen, otherwise use group_by and agg as in kosten_andere_df
    kosten_stellen_df = (bilanz_df.select([CN.jahr, CN.betrag, CN.label])
                         .filter(pl.col(CN.label) == CN.kosten_stellen)
                         .drop([CN.label])
                         .rename({CN.betrag: CN.kosten_stellen}))
    # add column CN.kosten_stellen to ifi_budget
    ifi_budget = (ifi_budget.join(kosten_stellen_df, on=CN.jahr, how="inner"))


    # Fourth, compute column CN.kosten_aversen:
    # In aversen_df, group by CN.jahr, sum up CN.netto_aversum per year (over all CN.einheit'en)
    aversen_per_year = aversen_df.group_by(CN.jahr).agg(pl.col(CN.netto_aversum).sum())
    aversen_per_year = aversen_per_year.with_columns(
        (-pl.col(CN.netto_aversum)).alias(CN.kosten_aversen)
    ).drop(CN.netto_aversum)
    # add column CN.kosten_aversen to ifi_budget
    ifi_budget = (ifi_budget.join(aversen_per_year, on=CN.jahr, how="inner"))
    # aversen_per_year_pd = aversen_per_year.to_pandas()
    # print(aversen_per_year_pd)

    # Fifth, compute column CN.kosten_anderes from bilanz_df
    kosten_andere_df = (bilanz_df.select([CN.jahr, CN.betrag, CN.label])
                        .filter(pl.col(CN.label) == CN.kosten_anderes)
                        .group_by(CN.jahr).agg(pl.col(CN.betrag).sum())
                        .drop([CN.label])
                        .rename({CN.betrag: CN.kosten_anderes}))
    # add column CN.kosten_stellen to ifi_budget
    ifi_budget = (ifi_budget.join(kosten_andere_df, on=CN.jahr, how="left"))

    # Sixth, compute column CN.kosten_total
    ifi_budget = ifi_budget.with_columns(
        (pl.col(CN.kosten_stellen) + pl.col(CN.kosten_aversen) + pl.col(CN.kosten_anderes)).alias(CN.kosten_total)
    )

    # Seventh, compute column CN.jahreszufluss_ifi_allg
    ifi_budget = ifi_budget.with_columns(
        (pl.col(CN.netto_laufende_mittel) + pl.col(CN.kosten_total)).alias(CN.jahreszufluss_ifi_allg)
    )

    # Eighth, compute remaining overall budget of IfI, i.e. CN.ifi_budget_allgemein
    ifi_budget = ifi_budget.with_columns(
        (pl.col(CN.jahreszufluss_ifi_allg) + pl.col(CN.reste_ifi_allgemein)).alias(CN.ifi_budget_allgemein)
    )

    # Ninth, sort rows by ascending years
    ifi_budget = ifi_budget.sort(CN.jahr)

    # Tenth, reorder columns
    num_cols_before = len(ifi_budget.columns)
    ifi_budget = ifi_budget.select([
        CN.jahr, CN.ifi_budget_allgemein, CN.jahreszufluss_ifi_allg, CN.reste_ifi_allgemein,
        CN.schoepfung,
        CN.netto_laufende_mittel, CN.kosten_total, CN.kosten_stellen, CN.kosten_aversen, CN.kosten_anderes,
        CN.laufende_mittel, CN.formelbudget, CN.strukturbeitrag, CN.landesminus, CN.flaechenbudgetierung,
        CN.globalbudget_a, CN.traditionelles_budget, CN.landesstellenbudget,
        CN.verf_mittel_ohne_reste, CN.reste_vorjahr, CN.verf_mittel_inkl_reste
    ])
    num_cols_after = len(ifi_budget.columns)
    assert num_cols_before == num_cols_after, "Number of columns changed during reordering of ifi_budget!"

    # debug
    # ifi_budget_pd = ifi_budget.to_pandas()
    # print(ifi_budget_pd)
    return ifi_budget



def process_all(in_dir, out_dir, in_file):
    sheet_names = {'JahresDaten', 'AversenDaten', 'BudgetDaten', 'BilanzDaten'}
    frames = read_in_data(in_dir, in_file, sheet_names)
    jahres_daten = frames['JahresDaten']
    aversen_daten = frames['AversenDaten']
    budget_daten = frames['BudgetDaten']
    bilanz_daten = frames['BilanzDaten']

    budget_flipped = prepare_budget_data(budget_daten)
    # budget_flipped_pd = budget_flipped.to_pandas()
    # print(budget_flipped_pd)

    bilanz_df = prepare_bilanz_data(bilanz_daten)
    # print(bilanz_df)
    aversen_df = calculate_aversen(jahres_daten, aversen_daten)
    aversen_df_pd = aversen_df.to_pandas()
    print(aversen_df_pd)

    budget_ifi = calculate_budget_ifi(budget_flipped, bilanz_df, aversen_df)
    budget_ifi_pd = budget_ifi.to_pandas()
    print(budget_ifi_pd)

    # Write the dataframes to excel files


    with Workbook(f'{out_dir}/IfI-Finanzen-berechnet.xlsx') as wb:
        tbl_style = {'style': "Table Style Light 9", 'banded_rows': True}
        column_format = {CN.jahr: '0'}
        budget_ifi.write_excel(workbook=wb,
                               worksheet='Budget_IfI_berechnet',
                               table_style=tbl_style,
                               autofit=True, float_precision=2, column_formats=column_format)

        aversen_df.write_excel(workbook=wb,
                               worksheet='Aversen_berechnet',
                               table_style=tbl_style,
                               autofit=True, float_precision=2, column_formats=column_format)



if __name__ == '__main__':
    in_dir = '../../data/in_data'
    out_dir = '../../data/out_data'
    in_file = '2023-Aversum-v6-for-script.xlsx'
    process_all(in_dir, out_dir, in_file)
