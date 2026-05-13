import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import LogoIcon from "../assets/Logo_Icon.svg";
import { api } from "../services/api";

export const Route = createFileRoute("/$id")({
  component: RedirectPage,
});

export function RedirectPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const processRedirect = async () => {
      try {
        const { originalUrl } = await api.getOriginalUrl(id);
        setDestination(originalUrl);

        api.incrementAccess(id).catch(console.error);

        setTimeout(() => {
          window.location.replace(originalUrl);
        }, 1500);
      } catch (error) {
        navigate({ to: "/404" }).catch(() => window.location.replace("/404"));
      }
    };

    processRedirect();
  }, [id, navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-200 px-5">
      <section className="max-w-145 w-full bg-gray-100 px-6 py-12 md:px-12 md:py-16 rounded-lg flex items-center justify-center flex-col gap-6 shadow-sm">
        <img src={LogoIcon} alt="Ícone Brev.ly" className="w-12 h-12" />

        <h1 className="etext-xl text-gray-600">Redirecionando...</h1>

        <div className="flex flex-col items-center gap-1">
          <p className="etext-md text-gray-500 text-center">
            O link será aberto automaticamente em alguns instantes.
          </p>
          <p className="etext-md text-gray-500 text-center">
            Não foi redirecionado?{" "}
            {destination ? (
              <a href={destination} className="text-blue-base hover:underline">
                Acesse aqui
              </a>
            ) : (
              <span className="text-gray-400">Aguarde...</span>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
