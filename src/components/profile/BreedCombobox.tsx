import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Common dog breeds for autocomplete
const DOG_BREEDS = [
  'Affenpinscher',
  'Afghan Hound',
  'Airedale Terrier',
  'Akita',
  'Alaskan Malamute',
  'American Bulldog',
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Australian Cattle Dog',
  'Australian Shepherd',
  'Basenji',
  'Basset Hound',
  'Beagle',
  'Bearded Collie',
  'Belgian Malinois',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Bloodhound',
  'Border Collie',
  'Border Terrier',
  'Boston Terrier',
  'Boxer',
  'Brittany',
  'Brussels Griffon',
  'Bull Terrier',
  'Bulldog',
  'Bullmastiff',
  'Cairn Terrier',
  'Cane Corso',
  'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever',
  'Chihuahua',
  'Chinese Crested',
  'Chinese Shar-Pei',
  'Chow Chow',
  'Cocker Spaniel',
  'Collie',
  'Corgi',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'Dogue de Bordeaux',
  'English Bulldog',
  'English Cocker Spaniel',
  'English Setter',
  'English Springer Spaniel',
  'French Bulldog',
  'German Pinscher',
  'German Shepherd',
  'German Shorthaired Pointer',
  'Giant Schnauzer',
  'Golden Retriever',
  'Goldendoodle',
  'Gordon Setter',
  'Great Dane',
  'Great Pyrenees',
  'Greater Swiss Mountain Dog',
  'Greyhound',
  'Havanese',
  'Irish Setter',
  'Irish Wolfhound',
  'Italian Greyhound',
  'Jack Russell Terrier',
  'Japanese Chin',
  'Keeshond',
  'Kerry Blue Terrier',
  'Labradoodle',
  'Labrador Retriever',
  'Lhasa Apso',
  'Maltese',
  'Mastiff',
  'Miniature Pinscher',
  'Miniature Schnauzer',
  'Mixed Breed',
  'Newfoundland',
  'Norfolk Terrier',
  'Norwegian Elkhound',
  'Norwich Terrier',
  'Old English Sheepdog',
  'Papillon',
  'Pekingese',
  'Pembroke Welsh Corgi',
  'Petit Basset Griffon Vendéen',
  'Pharaoh Hound',
  'Pointer',
  'Pomeranian',
  'Poodle',
  'Portuguese Water Dog',
  'Pug',
  'Rat Terrier',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Samoyed',
  'Schipperke',
  'Scottish Terrier',
  'Shetland Sheepdog',
  'Shiba Inu',
  'Shih Tzu',
  'Siberian Husky',
  'Silky Terrier',
  'Smooth Fox Terrier',
  'Soft Coated Wheaten Terrier',
  'Staffordshire Bull Terrier',
  'Standard Poodle',
  'Standard Schnauzer',
  'Tibetan Mastiff',
  'Tibetan Spaniel',
  'Tibetan Terrier',
  'Toy Poodle',
  'Vizsla',
  'Weimaraner',
  'Welsh Springer Spaniel',
  'Welsh Terrier',
  'West Highland White Terrier',
  'Whippet',
  'Wire Fox Terrier',
  'Wirehaired Pointing Griffon',
  'Yorkshire Terrier',
];

interface BreedComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function BreedCombobox({ value, onValueChange }: BreedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Filter breeds based on input
  const filteredBreeds = DOG_BREEDS.filter((breed) =>
    breed.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedBreed: string) => {
    onValueChange(selectedBreed);
    setInputValue(selectedBreed);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
    if (!open) setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mt-1 font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {value || 'Select or type breed...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search breeds..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <button
                  className="w-full p-2 text-left text-sm hover:bg-accent rounded"
                  onClick={() => handleSelect(inputValue)}
                >
                  Use "{inputValue}"
                </button>
              ) : (
                'Type to search breeds...'
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredBreeds.slice(0, 10).map((breed) => (
                <CommandItem
                  key={breed}
                  value={breed}
                  onSelect={() => handleSelect(breed)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === breed ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {breed}
                </CommandItem>
              ))}
              {filteredBreeds.length > 10 && (
                <p className="p-2 text-xs text-muted-foreground text-center">
                  Type more to narrow results...
                </p>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
