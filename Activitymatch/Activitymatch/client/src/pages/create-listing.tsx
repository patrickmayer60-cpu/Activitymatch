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
import logoImage from "@assets/image_1772317603904.png";

const CATEGORIES = ["Sport", "Gaming", "Musik", "Outdoor", "Fitness", "Sonstiges"] as const;
const GENDERS = ["Männlich", "Weiblich", "Divers", "Keine Angabe"] as const;
const LEVELS = ["Anfänger", "Amateur", "Profi"] as const;

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [secretKeyDialog, setSecretKeyDialog] = useState<{ open: boolean; key: string; id: number }>({
    open: false,
    key: "",
    id: 0,
  });
  const [copied, setCopied] = useState(false);
  const [flexibleDate, setFlexibleDate] = useState(false);

  const form = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      name: "",
      age: undefined as unknown as number,
      gender: undefined as unknown as "Männlich",
      city: "",
      category: undefined as unknown as "Sport",
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
        website: undefined,
      });
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setSecretKeyDialog({ open: true, key: result.secretKey, id: result.listing.id });
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
        message: "Datum ist erforderlich, wenn nicht 'Flexibel' gewählt",
      });
      return;
    }
    createMutation.mutate(data);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(secretKeyDialog.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const descriptionLength = form.watch("description")?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <img src={logoImage} alt="ActivityMatch" className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
            </Link>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-overview">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Zurück</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" data-testid="text-page-title">Anzeige erstellen</h2>
          <p className="text-muted-foreground mt-1">Finde Leute für deine nächste Aktivität</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Persönliche Angaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dein Name" {...field} data-testid="input-name" />
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
                        <FormLabel>Alter *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Dein Alter"
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
                        <FormLabel>Geschlecht *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
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
                        <FormLabel>Stadt *</FormLabel>
                        <CityCombobox
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Stadt auswählen..."
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
                <CardTitle className="text-base">Aktivität</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktivitätstitel *</FormLabel>
                      <FormControl>
                        <Input placeholder='z.B. "Tennispartner gesucht"' {...field} data-testid="input-title" />
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
                        <FormLabel>Kategorie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
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
                        <FormLabel>Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-level">
                              <SelectValue placeholder="Level wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEVELS.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
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
                      <FormLabel>Beschreibung *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Beschreibe deine Aktivität und was du suchst..."
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
                  }}>
                    Flexibel – kein festes Datum
                  </label>
                </div>

                {!flexibleDate && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="activityDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wann? (Datum) *</FormLabel>
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
                          <FormLabel>Uhrzeit (optional)</FormLabel>
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
                          <FormLabel>Wiederholung</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Einmalig"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-recurrence">
                                <SelectValue placeholder="Einmalig" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Einmalig">Einmalig</SelectItem>
                              <SelectItem value="Wöchentlich">Wöchentlich</SelectItem>
                              <SelectItem value="Monatlich">Monatlich</SelectItem>
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
                      <FormLabel>Wen suchst du? (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='z.B. "Frauen, 20-30 Jahre, Anfänger"'
                          maxLength={200}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-match-preference"
                        />
                      </FormControl>
                      <FormDescription>Beschreibe deine Wunsch-Partner (Geschlecht, Alter, Level)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Kontaktmöglichkeiten</CardTitle>
                <FormDescription>Mindestens eine Kontaktmöglichkeit angeben</FormDescription>
                {form.formState.errors.contactEmail?.message === "Mindestens eine Kontaktmöglichkeit ist erforderlich" && (
                  <p className="text-sm text-destructive mt-1" data-testid="text-contact-error">
                    Mindestens eine Kontaktmöglichkeit ist erforderlich
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="deine@email.de" {...field} value={field.value || ""} data-testid="input-email" />
                      </FormControl>
                      {form.formState.errors.contactEmail?.message !== "Mindestens eine Kontaktmöglichkeit ist erforderlich" && (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+49 123 456789" {...field} value={field.value || ""} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontakthinweis (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='z.B. "Anfrage über WhatsApp möglich"'
                          maxLength={200}
                          {...field}
                          value={field.value || ""}
                          data-testid="input-contact-note"
                        />
                      </FormControl>
                      <FormDescription>Zusätzliche Hinweise zur Kontaktaufnahme</FormDescription>
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
                    <FormLabel className="text-sm font-normal">
                      Ich stimme zu, dass meine Angaben öffentlich angezeigt werden *
                    </FormLabel>
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                "Anzeige veröffentlichen"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <Dialog open={secretKeyDialog.open} onOpenChange={(open) => {
        if (!open) {
          navigate(`/listing/${secretKeyDialog.id}`);
        }
        setSecretKeyDialog((prev) => ({ ...prev, open }));
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anzeige erfolgreich erstellt!</DialogTitle>
            <DialogDescription>
              Speichere diesen Secret-Key, um deine Anzeige später löschen zu können.
              Dieser Key wird nur einmal angezeigt!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all" data-testid="text-secret-key">
                {secretKeyDialog.key}
              </code>
              <Button size="icon" variant="outline" onClick={copyKey} data-testid="button-copy-key">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setSecretKeyDialog((prev) => ({ ...prev, open: false }));
                navigate(`/listing/${secretKeyDialog.id}`);
              }}
              data-testid="button-view-listing"
            >
              Anzeige ansehen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
