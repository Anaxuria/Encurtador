import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import Imagem404 from "../assets/404.svg";

export const Route = createFileRoute("/404")({
  component: NotFoundPage,
});

export function NotFoundPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-200">
      <section className="max-w-145 w-full max-h-82.25 h-full m-auto bg-white px-12 py-16 rounded-lg flex items-center justify-center flex-col gap-6">
        <img src={Imagem404} alt="Imagem 404" className="max-w-48.5 w-full" />
        <h1 className="etext-xl text-gray-600">Link não encontrado</h1>
        <p className="etext-md text-gray-500 text-center">
          O link que você está tentando acessar não existe, foi removido ou é
          uma URL inválida. Saiba mais em
          <Link to="/" className="text-blue-base">
            {" "}
            brev.ly.
          </Link>
        </p>
      </section>
    </div>
  );
}
