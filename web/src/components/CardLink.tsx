import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import IconCopyFile from "../assets/icon/icon-copy.svg";
import IconTrash from "../assets/icon/icon-trash.svg";
import IconEdit from "../assets/icon/icon-pencil.svg";
import { type LinkItem } from "../types";

interface CardLinkProps {
  link: LinkItem;
  onDelete: (shortLink: string) => void;
  onUpdate: (
    oldShortLink: string,
    originalUrl: string,
    newShortLink: string
  ) => Promise<void>;
}

export const CardLink = ({ link, onDelete, onUpdate }: CardLinkProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editOriginalUrl, setEditOriginalUrl] = useState(link.originalUrl);
  const [editShortLink, setEditShortLink] = useState(link.shortLink);
  const [showToast, setShowToast] = useState(false);

  const fullShortUrl = `${window.location.origin}/${link.shortLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDelete = () => {
    if (
      window.confirm(`Você realmente quer apagar o link ${link.shortLink}?`)
    ) {
      onDelete(link.shortLink);
    }
  };

  const handleSaveEdit = async () => {
    if (editShortLink) {
      if (editShortLink.length < 3) {
        alert("O link encurtado deve ter no mínimo 3 caracteres.");
        return;
      }
      if (!/^[a-z0-9]+$/.test(editShortLink)) {
        alert("Informe uma url minúscula e sem espaço/caracter especial.");
        return;
      }
    }

    try {
      await onUpdate(link.shortLink, editOriginalUrl, editShortLink);
      setIsEditing(false);
    } catch (error: any) {
      if (error.message === "shortLink já existente") {
        alert(
          "O link encurtado escolhido já está em uso. Por favor, escolha outro."
        );
      } else {
        alert(error.message || "Erro ao atualizar.");
      }
      console.error("Erro ao atualizar:", error);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        <hr className="w-full border-t border-gray-200" />

        {isEditing ? (
          <div className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
            <Input
              label="Link Original"
              value={editOriginalUrl}
              onChange={(e) => setEditOriginalUrl(e.target.value)}
            />
            <Input
              label="Link Encurtado"
              prefixText="brev.ly/"
              value={editShortLink}
              onChange={(e) => setEditShortLink(e.target.value)}
            />
            <div className="flex gap-2 justify-end mt-2">
              <div className="w-fit">
                <Button
                  variant="secondary"
                  label="Cancelar"
                  onClick={() => setIsEditing(false)}
                />
              </div>
              <div className="w-fit">
                <Button
                  variant="primary"
                  label="Salvar"
                  onClick={handleSaveEdit}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1 w-full overflow-hidden">
              <a
                href={`/${link.shortLink}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-base etext-md truncate hover:underline"
              >
                brev.ly/{link.shortLink}
              </a>
              <p className="text-gray-500 etext-sm truncate">
                {link.originalUrl}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="text-gray-500 etext-sm">
                {link.accessCount} acessos
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  img={IconEdit}
                  onClick={() => setIsEditing(true)}
                  title="Editar link"
                />
                <Button
                  variant="secondary"
                  img={IconCopyFile}
                  onClick={handleCopy}
                  title="Copiar link"
                />
                <Button
                  variant="secondary"
                  img={IconTrash}
                  onClick={handleDelete}
                  title="Excluir link"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#E8F0FE] border border-blue-base/20 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 z-50">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"
              fill="#2C46B1"
            />
          </svg>
          <div className="flex flex-col">
            <span className="etext-md text-blue-base">
              Link copiado com sucesso
            </span>
            <span className="etext-sm text-blue-base opacity-80 mt-1">
              O link brev.ly/{link.shortLink} foi copiado para a area de
              transferencia.
            </span>
          </div>
        </div>
      )}
    </>
  );
};
