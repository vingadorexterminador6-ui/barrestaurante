import { Link } from "@tanstack/react-router";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/gestao/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClientAreaLink() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/cliente`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link da área do cliente copiado.");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Área do cliente", url });
        return;
      } catch {
        /* cancelado */
      }
    }
    void copy();
  };

  return (
    <SectionCard
      title="Link da área do cliente"
      description="Partilhe para os clientes fazerem pedidos, reservas e pagamentos"
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to="/cliente">
            Abrir <ExternalLink className="ml-2 size-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" onClick={copy} title="Copiar link">
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={share}>
              Partilhar link
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Faça o seu pedido ou reserva aqui: ${url}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Enviar por WhatsApp
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Na área do cliente aparecem todos os produtos registados pela equipa, com pedidos,
            reservas de mesa e escolha de pagamento (M-Pesa, e-Mola, dinheiro e mais).
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          {origin ? (
            <img
              src={qr}
              alt="Código QR para abrir a área do cliente"
              className="size-[140px] rounded-lg border border-border bg-white p-1"
              loading="lazy"
            />
          ) : (
            <div className="size-[140px] rounded-lg border border-border" />
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <QrCode className="size-3" /> Para colar nas mesas
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
