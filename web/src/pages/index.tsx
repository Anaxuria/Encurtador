import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/Button";
import { CardLink } from "../components/CardLink";
import { Input } from "../components/Input";
import IconDownload from "../assets/icon/icon-downloadSimple.svg";
import DangerIcon from "../assets/icon/icon-warning.svg";
import Logo from "../assets/Logo.svg";
import { useLinks } from "../hooks/useLink";

export const Route = createFileRoute("/")({
  component: HomePage,
});

export function HomePage() {
  const { links, createLink, updateLink, removeLink, exportToCsv } = useLinks();

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortLink, setShortLink] = useState("");

  const [originalUrlError, setOriginalUrlError] = useState("");
  const [shortLinkError, setShortLinkError] = useState("");

  const [showDuplicateToast, setShowDuplicateToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOriginalUrlError("");
    setShortLinkError("");

    if (!originalUrl) {
      setOriginalUrlError("A URL original é obrigatória.");
      return;
    }

    if (shortLink) {
      if (shortLink.length < 3) {
        setShortLinkError("O link encurtado deve ter no mínimo 3 caracteres.");
        return;
      }
      if (!/^[a-z0-9]+$/.test(shortLink)) {
        setShortLinkError(
          "Informe uma url minúscula e sem espaço/caracter especial."
        );
        return;
      }
    }

    let finalUrl = originalUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      await createLink(finalUrl, shortLink);
      setOriginalUrl("");
      setShortLink("");
    } catch (err: any) {
      if (err.message === "shortLink já existente") {
        setShowDuplicateToast(true);
        setTimeout(() => setShowDuplicateToast(false), 3000);
      } else {
        setOriginalUrlError(err.message || "Informe uma URL válida.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center pt-8 sm:pt-20 px-5 pb-10 mx-auto">
      <main className="w-full max-w-245 mx-auto flex flex-col items-center lg:items-start justify-center gap-6">
        <img src={Logo} alt="brev.ly" className="h-6 mb-6 lg:mb-12" />

        <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-6">
          <section className="w-full lg:w-95 bg-gray-100 p-6 sm:p-8 rounded-lg shadow-sm flex flex-col gap-6 h-fit">
            <h2 className="etext-lg text-gray-600">Novo link</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Link original"
                placeholder="www.exemplo.com.br"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                error={!!originalUrlError}
                errorMessage={"Informa uma url válida."}
              />
              <Input
                label="Link encurtado (opcional)"
                placeholder="meulink"
                prefixText="brev.ly/"
                value={shortLink}
                onChange={(e) => setShortLink(e.target.value)}
                error={!!shortLinkError}
                errorMessage={shortLinkError}
              />
              <Button variant="primary" label="Salvar link" type="submit" />
            </form>
          </section>

          <section className="w-full lg:w-145 bg-gray-100 p-6 sm:p-8 rounded-lg shadow-sm flex flex-col gap-5">
            <header className="flex justify-between items-center">
              <h2 className="etext-lg text-gray-600">Meus links</h2>
              <Button
                variant="secondary"
                img={IconDownload}
                label="Baixar CSV"
                onClick={exportToCsv}
              />
            </header>

            <div
              className="flex flex-col gap-4 mt-2 max-h-112.5 overflow-y-auto pr-2 
              [&::-webkit-scrollbar]:w-2 
              [&::-webkit-scrollbar-track]:bg-gray-200 
              [&::-webkit-scrollbar-thumb]:bg-blue-base 
              [&::-webkit-scrollbar-thumb]:rounded-none"
            >
              {links.length > 0 ? (
                links.map((link) => (
                  <CardLink
                    key={link.id}
                    link={link}
                    onDelete={removeLink}
                    onUpdate={updateLink}
                  />
                ))
              ) : (
                <>
                  <hr className="w-full border-t border-gray-200" />
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <p className="etext-xs text-gray-500">
                      Ainda não existem links cadastrados
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {showDuplicateToast && (
        <div className="fixed bottom-6 right-6 bg-[#FDECEA] border border-danger/20 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 z-50">
          <img
            src={DangerIcon}
            alt="Atenção"
            className="w-6 h-6 shrink-0 mt-0.5"
          />
          <div className="flex flex-col">
            <span className="etext-md text-danger">Link indisponível</span>
            <span className="etext-sm text-danger opacity-80 mt-1">
              O link encurtado escolhido já está em uso. Por favor, escolha
              outro.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
