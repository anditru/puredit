# (C) 2023 Artur Andrzejak
# Utility functions, constants and definitions

import polars as pl


# column names, full and prefixes
class CN:
    # Prefixes of multiple columns
    prefix_wert = 'Wert_'
    prefix_anzahl = 'Zahl_'
    prefix_abzug = 'Abzug_'

    # Columns in JahresDaten
    jahr = 'Jahr'
    struktur_prozent = 'StrukturProzent'
    landesm_prozent = 'LandesmProzent'

    # Columns in AversenDaten
    einheit = 'Einheit'
    aversum_brutto = 'Aversum_Brutto'
    target_zuschuss = 'Target_Zuschuss_ifi'
    target_netto = 'Target_Netto'
    rest_vorjahr = 'Rest_Vorjahr'
    schoepfung1 = 'Schöpfung_1'
    schoepfung2 = 'Schöpfung_2'
    einmalzahlung1 = 'Einmalzahlung_1'
    kommentar_1 = 'Kommentar_1'
    kommentar_2 = 'Kommentar_2'
    kommentar_3 = 'Kommentar_3'

    # Columns in BudgetDaten
    label = 'Label'
    name_budgetheft = 'Name_Budgetheft'
    erlauterung = 'Erläuterung'
    # betrag = 'Betrag'   # in the transformed df

    # Columns in BilanzDaten
    quelle = 'Quelle'
    ziel = 'Ziel'
    betrag = 'Betrag'
    beschreibung_1 = 'Beschreibung_1'
    beschreibung_2 = 'Beschreibung_2'

    # Columns in AversenBerechnet
    stellenwert_gesamt = 'Stellenwert_Gesamt'
    abzug_strukt_aversum = prefix_abzug + 'Strukt_Aversum'
    abzug_landesm_aversum = prefix_abzug + 'Landesm_Aversum'
    abzug_strukt_stellen = prefix_abzug + 'Strukt_Stellen'
    abzug_landesm_stellen = prefix_abzug + 'Landesm_Stellen'
    abzug_total = 'Abzug_Total'
    zuschuss_ifi = 'Zuschuss_IfI'
    netto_aversum = 'Netto_Aversum'
    jahreszufluss = 'Jahreszufluss'
    jahresbudget = 'Jahresbudget'

    # Label values in budget_flipped (computed)
    laufende_mittel = 'laufende_mittel'
    landesstellenbudget = 'landesstellenbudget'
    globalbudget_a = 'globalbudget_a'
    formelbudget = 'formelbudget'
    traditionelles_budget = 'traditionelles_budget'
    strukturbeitrag = 'strukturbeitrag'
    landesminus = 'landesminus'
    schoepfung = 'schoepfung'
    flaechenbudgetierung = 'flaechenbudgetierung'
    verf_mittel_ohne_reste = 'verf_mittel_ohne_reste'
    reste_vorjahr = 'reste_vorjahr'
    verf_mittel_inkl_reste = 'verf_mittel_inkl_reste'
    reste_ifi_allgemein = 'reste_ifi_allgemein'

    columns_budget_ifi = "Jahr	globalbudget_a	landeststellenbudget	verf_mittel_ohne_reste	schoepfung	formelbudget	laufende_mittel	strukturbeitrag	landesminus	flaechenbudgetierung	netto_laufende_mittel	stellen_kosten	aversen_kosten	sonstige_kosten	jahresbilanz"

    # Columns in BudgetIfi
    netto_laufende_mittel = 'netto_laufende_mittel'
    kosten_stellen = 'Kosten_Stellen'
    kosten_aversen = 'Kosten_Aversen'
    kosten_anderes = 'Kosten_Anderes'
    kosten_total = 'Kosten_Total'
    jahreszufluss_ifi_allg = 'Jahreszufluss_IfI_Allg'
    ifi_budget_allgemein = 'IfI_Budget_Allgemein'


def read_spreadsheet(filename, sheetname):
    # Read excel spreadsheet and returns polars dataframe
    df = pl.read_excel(source=filename, sheet_name=sheetname)
    return df


def read_in_data(in_dir, in_file, sheet_names):
    frames = {}
    for sheet_name in sheet_names:
        frames[sheet_name] = read_spreadsheet(f'{in_dir}/{in_file}', sheet_name)
    return frames


def filter_strings_by_prefix(column_names, prefix):
    # Get column names that start with prefix, remove prefix and return as list
    filtered = [column_name[len(prefix):] for column_name in column_names if column_name.startswith(prefix)]
    return filtered

def check_column_for_valid_numeric_values(df, column_name):
    type_ok = df[column_name].dtype in [pl.Int64, pl.Float64]
    # Check if non-null values in the this column contain at least one value > 0.0
    return type_ok and (not df.drop_nulls(column_name).filter(pl.col(column_name) > 0.0).is_empty())

