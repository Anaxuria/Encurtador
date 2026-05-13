import { type LinkItem, type PaginatedResponse } from "../types";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const api = {
  createLink: async (
    originalUrl: string,
    shortLink?: string
  ): Promise<{ link: LinkItem }> => {
    const response = await fetch(`${API_URL}/links/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl, shortLink }),
    });
    if (!response.ok) throw new Error("Erro ao criar link");
    return response.json();
  },

  getLinks: async (
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<LinkItem>> => {
    const response = await fetch(
      `${API_URL}/links/?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Erro ao buscar links");
    return response.json();
  },

  getOriginalUrl: async (
    shortLink: string
  ): Promise<{ originalUrl: string }> => {
    const response = await fetch(`${API_URL}/links/${shortLink}/original`);
    if (!response.ok) throw new Error("Link não encontrado");
    return response.json();
  },

  incrementAccess: async (
    shortLink: string
  ): Promise<{ accessCount: number }> => {
    const response = await fetch(`${API_URL}/links/${shortLink}/access`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Erro ao registrar acesso");
    return response.json();
  },

  updateLink: async (
    oldShortLink: string,
    originalUrl: string,
    newShortLink: string
  ): Promise<{ originalUrl: string; shortLink: string }> => {
    const response = await fetch(`${API_URL}/links/${oldShortLink}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl, shortLink: newShortLink }),
    });
    if (!response.ok) throw new Error("Erro ao atualizar link");
    return response.json();
  },

  deleteLink: async (shortLink: string): Promise<{ ok: boolean }> => {
    const response = await fetch(`${API_URL}/links/${shortLink}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao deletar link");
    return response.json();
  },

  exportLinks: async (): Promise<{ url: string; key: string }> => {
    const response = await fetch(`${API_URL}/links/export`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Erro ao exportar links");
    return response.json();
  },
};
