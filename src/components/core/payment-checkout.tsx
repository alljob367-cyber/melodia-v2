/**
 * PaymentCheckout — Modal component for payment flow
 * 
 * Supports: Stripe (redirect), Wave (Senegal mobile), FPay (Orange/MTN/Moov)
 * Integrates with usePayment hook and PaymentOrchestrator.
 */

"use client";

import { useState } from "react";
import { usePayment } from "@/hooks/use-core";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Loader2, Check, AlertCircle, Zap } from "lucide-react";

interface PaymentCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packId: string;
  packName: string;
  priceFcfa: number;
  credits: number;
}

export function PaymentCheckout({
  open, onOpenChange, packId, packName, priceFcfa, credits,
}: PaymentCheckoutProps) {
  const [provider, setProvider] = useState<"stripe" | "wave" | "fpay">("wave");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState<"orange" | "mtn" | "moov">("orange");
  const { loading, error, startCheckout } = usePayment();

  const handlePay = async () => {
    const options: Record<string, unknown> = {};
    if (provider === "wave" || provider === "fpay") {
      options.phoneNumber = phoneNumber;
    }
    if (provider === "fpay") {
      options.mobileProvider = mobileProvider;
    }

    const result = await startCheckout(packId, provider, options as any);
    if (result) {
      // For Stripe/Wave, the user is redirected. For FPay, we might need to show a USSD prompt.
      if (provider === "fpay" && !result.checkoutUrl) {
        // FPay might return a USSD code or prompt
      }
    }
  };

  const formatPrice = (fcfa: number) => {
    return new Intl.NumberFormat("fr-FR").format(fcfa) + " FCFA";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Acheter des crédits
          </DialogTitle>
          <DialogDescription>
            Choisissez votre méthode de paiement préférée
          </DialogDescription>
        </DialogHeader>

        {/* Pack summary */}
        <div className="bg-purple-500/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">{packName}</p>
            <p className="text-sm text-muted-foreground">{credits} crédits Melodia</p>
          </div>
          <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
            {formatPrice(priceFcfa)}
          </Badge>
        </div>

        {/* Provider selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Méthode de paiement</Label>
          <RadioGroup
            value={provider}
            onValueChange={(v) => setProvider(v as "stripe" | "wave" | "fpay")}
            className="space-y-2"
          >
            {/* Wave — Senegal */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wave" id="wave" className="border-blue-400" />
              <Label htmlFor="wave" className="flex items-center gap-2 cursor-pointer flex-1">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 w-full hover:bg-white/5 transition">
                  <Smartphone className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">Wave</p>
                    <p className="text-xs text-muted-foreground">Mobile Money — Sénégal</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-blue-400 border-blue-400/30 text-xs">Populaire</Badge>
                </div>
              </Label>
            </div>

            {/* FPay — Orange/MTN/Moov */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fpay" id="fpay" className="border-orange-400" />
              <Label htmlFor="fpay" className="flex items-center gap-2 cursor-pointer flex-1">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 w-full hover:bg-white/5 transition">
                  <Smartphone className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-white">Mobile Money</p>
                    <p className="text-xs text-muted-foreground">Orange • MTN • Moov</p>
                  </div>
                </div>
              </Label>
            </div>

            {/* Stripe — International */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stripe" id="stripe" className="border-purple-400" />
              <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 w-full hover:bg-white/5 transition">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="font-medium text-white">Carte bancaire</p>
                    <p className="text-xs text-muted-foreground">Visa • Mastercard • Apple Pay</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Phone number for mobile money */}
        {(provider === "wave" || provider === "fpay") && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={provider === "wave" ? "77 XXX XX XX" : "07 XX XX XX XX"}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white/5"
              />
            </div>

            {/* Mobile provider selection for FPay */}
            {provider === "fpay" && (
              <div className="space-y-2">
                <Label className="text-sm">Opérateur</Label>
                <RadioGroup
                  value={mobileProvider}
                  onValueChange={(v) => setMobileProvider(v as "orange" | "mtn" | "moov")}
                  className="flex gap-2"
                >
                  {[
                    { value: "orange", label: "Orange Money", color: "text-orange-400" },
                    { value: "mtn", label: "MTN MoMo", color: "text-yellow-400" },
                    { value: "moov", label: "Moov Money", color: "text-green-400" },
                  ].map((op) => (
                    <div key={op.value} className="flex items-center space-x-1">
                      <RadioGroupItem value={op.value} id={op.value} />
                      <Label htmlFor={op.value} className={`text-xs cursor-pointer ${op.color}`}>
                        {op.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Pay button */}
        <Button
          onClick={handlePay}
          disabled={loading || ((provider === "wave" || provider === "fpay") && !phoneNumber)}
          className="w-full btn-gradient gap-2 h-12 text-base"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="h-5 w-5" />
              Payer {formatPrice(priceFcfa)}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Paiement sécurisé • Crédits ajoutés instantanément après confirmation
        </p>
      </DialogContent>
    </Dialog>
  );
}
