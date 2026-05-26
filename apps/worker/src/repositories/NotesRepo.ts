import NotesDAL from "@/data-access-layer/NotesDAL";
import type * as Schemas from "@app/schemas";

export default class NotesRepo {
  private dal: NotesDAL;

  constructor(env: Env) {
    this.dal = new NotesDAL(env);
  }

  async createNote(params: Schemas.CreateNoteApiRequest & { userId: string }) {
    return await this.dal.createNote({
      userId: params.userId,
      title: params.note.title,
      body: params.note.body,
    });
  }

  async getNoteDetails(params: { userId: string; id: number }) {
    return await this.dal.getNoteDetails(params);
  }

  async getNotes(params: { userId: string }) {
    return await this.dal.getNotes(params);
  }

  async updateNote(params: Schemas.UpdateNoteApiRequest & { userId: string; id: number }) {
    return await this.dal.updateNote({
      id: params.id,
      userId: params.userId,
      title: params.note.title ?? null,
      body: params.note.body ?? null,
    });
  }

  async deleteNote(params: { userId: string; id: number }) {
    return await this.dal.deleteNote(params);
  }
}
