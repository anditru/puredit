export interface Message {
  id: string;
  type: MessageType;
  action: Action;
  payload?: any;
}

export const enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
}

export const enum Action {
  GET_DOCUMENT = "GET_DOCUMENT",
  SEND_DOCUMENT = "SEND_DOCUMENT",
  UPDATE_DOCUMENT = "UPDATE_DOCUMENT",
  UPDATE_EDITOR = "UPDATE_EDITOR",
  UPDATE_PROJECTIONS = "UPDATE_PROJECTIONS",
  GET_PROJECTION_EXTENSIONS = "GET_PROJECTION_EXTENSIONS",
}

export type MessagePayload = ChangeDocumentPayload | ChangeEditorPayload | string | any;

export interface ChangeDocumentPayload {
  type: ChangeType;
  from: number;
  to: number;
  insert: string;
}

export interface ChangeEditorPayload {
  from: number;
  to: number;
  insert: string;
}

export const enum ChangeType {
  INSERTION = "INSERTION",
  REPLACEMENT = "REPLACEMENT",
  DELETION = "DELETION",
}
