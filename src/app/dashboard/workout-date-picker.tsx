'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDate } from '@/lib/format';

/** Puts the selected day in the URL so the page can fetch it on the server. */
export function WorkoutDatePicker({ date }: { date: Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="lg" />}
        className="w-48 justify-start font-normal"
      >
        <CalendarIcon data-icon="inline-start" />
        {formatDate(date)}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(selected) => {
            if (selected) {
              setOpen(false);
              router.push(`/dashboard?date=${format(selected, 'yyyy-MM-dd')}`);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
