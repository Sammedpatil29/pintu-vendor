import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light' | 'system';

const THEME_STORAGE_KEY = 'pintu_vendor_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Reactive theme signal
  public currentTheme = signal<AppTheme>(this.getInitialTheme());
  public isDark = signal<boolean>(this.calculateIsDark(this.currentTheme()));

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.applyTheme(this.currentTheme());

    // Listen to OS scheme changes when set to 'system'
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  private getInitialTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Fallback if localStorage unavailable
    }
    return 'dark'; // Default to dark as requested
  }

  private calculateIsDark(theme: AppTheme): boolean {
    if (theme === 'system') {
      return this.mediaQuery.matches;
    }
    return theme === 'dark';
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
    this.applyTheme(theme);
  }

  public toggleTheme(): void {
    const next: AppTheme = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }

  private applyTheme(theme: AppTheme): void {
    const isDarkMode = this.calculateIsDark(theme);
    this.isDark.set(isDarkMode);

    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }
}

