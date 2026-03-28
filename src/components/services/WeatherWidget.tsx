import { useEffect, useState } from 'react';
import { Cloud, Droplets, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  city: string;
}

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { lat: latitude, lon: longitude },
        });
        if (error) throw error;
        setWeather(data);
      } catch (e) {
        console.error('Weather fetch failed:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <Card className="p-3 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="p-3 flex items-center gap-3 bg-card/80 backdrop-blur border-border">
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
        alt={weather.description}
        className="w-10 h-10"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold">{weather.temp}°F</span>
          <span className="text-xs text-muted-foreground capitalize truncate">{weather.description}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Droplets className="w-3 h-3" /> {weather.humidity}%
          </span>
          <span className="flex items-center gap-0.5">
            <Wind className="w-3 h-3" /> {weather.wind_speed} mph
          </span>
          {weather.city && (
            <span className="flex items-center gap-0.5">
              <Cloud className="w-3 h-3" /> {weather.city}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
