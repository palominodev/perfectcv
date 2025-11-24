"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Loader2 } from "lucide-react"

interface ComingSoonModalProps {
  children: React.ReactNode
}

export function ComingSoonModal({ children }: ComingSoonModalProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSuccess(true)
    setEmail("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closed
      setTimeout(() => {
        setIsSuccess(false)
        setIsSubmitting(false)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isSuccess ? "¡Recibido!" : "Estamos en construcción"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {isSuccess
              ? "Gracias por tu interés. Te avisaremos en cuanto estemos listos."
              : "Deja tu correo y te avisaremos cuando lancemos la plataforma."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-[250px]">
                Hemos guardado tu correo correctamente.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Notificarme"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
