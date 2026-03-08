import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { germanCities } from "@/data/german-cities";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function CityCombobox({ value, onChange, placeholder = "Stadt auswählen...", ...props }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search || search.length < 1) return [];
    const lower = search.toLowerCase();
    const results: { plz: string; city: string }[] = [];
    for (const entry of germanCities) {
      if (
        entry.city.toLowerCase().startsWith(lower) ||
        entry.plz.startsWith(search)
      ) {
        results.push(entry);
        if (results.length >= 50) break;
      }
    }
    if (results.length < 50) {
      for (const entry of germanCities) {
        if (
          !entry.city.toLowerCase().startsWith(lower) &&
          !entry.plz.startsWith(search) &&
          entry.city.toLowerCase().includes(lower)
        ) {
          results.push(entry);
          if (results.length >= 50) break;
        }
      }
    }
    return results;
  }, [search]);

  const selectedEntry = useMemo(() => {
    if (!value) return null;
    return germanCities.find(e => e.city === value) || null;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          data-testid={props["data-testid"]}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {selectedEntry ? `${selectedEntry.plz} ${selectedEntry.city}` : value}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="PLZ oder Stadt eingeben..."
            value={search}
            onValueChange={setSearch}
            data-testid={props["data-testid"] ? `${props["data-testid"]}-search` : undefined}
          />
          <CommandList>
            {search.length < 1 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Tippe mindestens 1 Zeichen ein...
              </div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>Keine Stadt gefunden.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((entry) => (
                  <CommandItem
                    key={`${entry.plz}-${entry.city}`}
                    value={`${entry.plz}-${entry.city}`}
                    onSelect={() => {
                      onChange(entry.city);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`city-option-${entry.plz}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === entry.city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-muted-foreground mr-2 font-mono text-xs">{entry.plz}</span>
                    {entry.city}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
