import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const TIME_ZONE = 'America/Bogota';
const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;
const CHECK_INTERVAL_MS = 60_000;

/**
 * Los servicios backend se apagan fuera de horario mediante una Lambda programada
 * en AWS (8:00 a. m. - 6:00 p. m., hora de Colombia). Este servicio refleja esa
 * misma ventana en el frontend para informar al usuario.
 */
@Injectable({ providedIn: 'root' })
export class ServiceAvailabilityService {
  private readonly destroyRef = inject(DestroyRef);

  readonly available = signal(this.computeAvailability());

  constructor() {
    const intervalId = setInterval(
      () => this.available.set(this.computeAvailability()),
      CHECK_INTERVAL_MS,
    );
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  private computeAvailability(): boolean {
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(new Date()),
    );
    return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  }
}
