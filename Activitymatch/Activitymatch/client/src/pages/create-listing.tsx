import { getLanguage, t, locale } from "@/lib/i18n";
import { CATEGORIES } from "@shared/categories";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { insertListingSchema, type InsertListing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CityCombobox } from "@/components/city-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";


const GENDERS = ["Männlich", "Weiblich", "Divers", "Keine Angabe"] as const;
const LEVELS = ["Anfänger", "Amateur", "Profi"] as const;

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [flexibleDate, setFlexibleDate] = useState(false);

  const form = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      name: "",
      age: undefined as unknown as number,
      gender: undefined as unknown as "Männlich",
      city: "",
      category: undefined as unknown as InsertListing["category"],
      title: "",
      description: "",
      level: undefined as unknown as "Anfänger",
      activityDate: "",
      activityTime: "",
      recurrence: "Einmalig" as const,
      matchPreference: "",
      contactEmail: "",
      contactPhone: "",
      contactNote: "",
      consent: false as unknown as true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertListing) => {
      const res = await apiRequest("POST", "/api/listings", {
        ...data,
        language: getLanguage(),
        website: (document.querySelector('input[name="website"]') as HTMLInputElement)?.value || "",
      });
      return res.json();
    },
    onSuccess: (result) => {
      setConfirmationMessage(result.message);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertListing) => {
    if (!flexibleDate && !data.activityDate) {
      form.setError("activityDate", {
        type: "manual",
        message: t("Datum ist erforderlich, wenn nicht 'Flexibel' gewählt"),
      });
      return;
    }
    createMutation.mutate(data);
  };

  const descriptionLength = form.watch("description")?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <BrandLogo className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
            </Link>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-overview">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{t("Zurück")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" data-testid="text-page-title">{t("Anzeige erstellen")}</h2>
          <p className="text-muted-foreground mt-1">{t("Finde Leute für deine nächste Aktivität")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t("Aktivität")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Aktivitätstitel *")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("z.B. \"Tennispartner gesucht\"")} {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Kategorie *")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder={t("Kategorie wählen")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{t(c)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Level *")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-level">
                              <SelectValue placeholder={t("Level wählen")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEVELS.map((l) => (
                              <SelectItem key={l} value={l}>{t(l)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Beschreibung *")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("Beschreibe deine Aktivität und was du suchst...")}
                          className="resize-none min-h-[100px]"
                          maxLength={500}
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className={`text-xs ml-auto ${descriptionLength > 450 ? "text-destructive" : "text-muted-foreground"}`}>
                          {descriptionLength}/500
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-3 space-y-0">
                  <Checkbox
                    checked={flexibleDate}
                    onCheckedChange={(checked) => {
                      setFlexibleDate(!!checked);
                      if (checked) {
                        form.setValue("activityDate", "");
                        form.setValue("activityTime", "");
                        form.setValue("recurrence", "Einmalig");
                      }
                    }}
                    data-testid="checkbox-flexible-date"
                  />
                  <label className="text-sm font-medium leading-none cursor-pointer" onClick={() => {
                    const next = !flexibleDate;
                    setFlexibleDate(next);
                    if (next) {
                      form.setValue("activityDate", "");
                      form.setValue("activityTime", "");
                      form.setValue("recurrence", "Einmalig");
                    }
                  }}>{t("Flexibel – kein festes Datum")}</label>
                </div>

                {!flexibleDate && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="activityDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Wann? (Datum) *")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} data-testid="input-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="activityTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Uhrzeit (optional)")}</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} value={field.value || ""} data-testid="input-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Wiederholung")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Einmalig"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-recurrence">
                                <SelectValue placeholder={t("Einmalig")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Einmalig">{t("Einmalig")}</SelectItem>
                              <SelectItem value="Wöchentlich">{t("Wöchentlich")}</SelectItem>
                              <SelectItem value="Monatlich">{t("Monatlich")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="matchPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Wen suchst du? (optional)")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("z.B. \"Frauen, 20-30 Jahre, Anfänger\"")}
                          maxLength={200}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-match-preference"
                        />
                      </FormControl>
                      <FormDescription>{t("Beschreibe deine Wunsch-Partner (Geschlecht, Alter, Level)")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t("Persönliche Angaben")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Vorname *")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Dein Vorname")} {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Alter *")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("Dein Alter")}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Geschlecht *")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder={t("Auswählen")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{t(g)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Stadt *")}</FormLabel>
                        <CityCombobox
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("Stadt auswählen...")}
                          data-testid="input-city"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t("Kontaktmöglichkeiten")}</CardTitle>
                <FormDescription>{t("Deine E-Mail-Adresse bleibt privat. Interessenten schreiben dir über ein Kontaktformular.")}</FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("E-Mail-Adresse (privat) *")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t("deine@email.de")} {...field} value={field.value || ""} data-testid="input-email" />
                      </FormControl>
                      {form.formState.errors.contactEmail?.message !== "Mindestens eine Kontaktmöglichkeit ist erforderlich" && (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Kontakthinweis (optional)")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("z.B. \"Ich antworte meistens abends\"")}
                          maxLength={200}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-contact-note"
                        />
                      </FormControl>
                      <FormDescription>{t("Öffentlich sichtbar. Bitte keine Telefonnummer oder E-Mail-Adresse eintragen.")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-consent"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">{t("Ich stimme zu, dass meine Anzeige und persönlichen Angaben öffentlich angezeigt werden. Meine E-Mail-Adresse bleibt privat und wird für Bestätigung und Kontaktanfragen verwendet. *")}</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={createMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("Wird erstellt...")}</>
              ) : (
                t("Bestätigungslink anfordern")
              )}
            </Button>
          </form>
        </Form>
      </div>

      <Dialog open={!!confirmationMessage} onOpenChange={(open) => { if (!open) navigate("/"); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Bitte prüfe dein E-Mail-Postfach")}</DialogTitle>
            <DialogDescription>{t(confirmationMessage)} {t("Bitte prüfe auch den Spamordner. In der E-Mail findest du außerdem deinen privaten Verwaltungslink.")}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/")}>{t("Zur Übersicht")}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
