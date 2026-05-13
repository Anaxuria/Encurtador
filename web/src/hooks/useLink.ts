import { useState, useEffect, useCallback } from "react";
import { type LinkItem } from "../types";
import { api } from "../services/api";

export function useLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getLinks(1, 50);
      setLinks(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = async (originalUrl: string, shortLink?: string) => {
    try {
      const data = await api.createLink(originalUrl, shortLink);
      setLinks((prev) => [data.link, ...prev]);
    } catch (err: any) {
      throw err;
    }
  };

  const updateLink = async (
    oldShortLink: string,
    newOriginalUrl: string,
    newShortLink: string
  ) => {
    try {
      await api.updateLink(oldShortLink, newOriginalUrl, newShortLink);
      setLinks((prev) =>
        prev.map((link) =>
          link.shortLink === oldShortLink
            ? { ...link, originalUrl: newOriginalUrl, shortLink: newShortLink }
            : link
        )
      );
    } catch (err: any) {
      throw err;
    }
  };

  const removeLink = async (shortLink: string) => {
    try {
      await api.deleteLink(shortLink);
      setLinks((prev) => prev.filter((link) => link.shortLink !== shortLink));
    } catch (err: any) {
      throw err;
    }
  };

  const exportToCsv = async () => {
    try {
      const { url } = await api.exportLinks();
      window.open(url, "_blank"); 
    } catch (err: any) {
      console.error("Falha ao exportar CSV:", err);
    }
  };

  return {
    links,
    isLoading,
    error,
    createLink,
    updateLink,
    removeLink,
    exportToCsv,
    refetch: fetchLinks,
  };
}
