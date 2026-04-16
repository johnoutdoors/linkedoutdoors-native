export const LOCATIONS: Record<string, string[]> = {
  'Maryland': ['Western Maryland', 'Central Maryland', 'Southern Maryland', 'Eastern Shore', 'Coastal Maryland', 'Baltimore Area'],
  'Delaware': ['Northern Delaware', 'Central Delaware', 'Southern Delaware / Beaches', 'Delaware Bay'],
  'Virginia': ['Northern Virginia', 'Shenandoah Valley', 'Blue Ridge Mountains', 'Eastern Shore of Virginia', 'Chesapeake Bay Area', 'Hampton Roads'],
  'Pennsylvania': ['Southeast PA', 'Pocono Mountains', 'Central PA / Susquehanna', 'Allegheny Mountains', 'Southwest PA'],
  'West Virginia': ['Eastern Panhandle', 'Monongahela Forest', 'New River Gorge', 'Canaan Valley'],
};

export const STATES = Object.keys(LOCATIONS);

export function formatLocation(state: string | null, region: string | null): string | null {
  if (!state) return null;
  return region ? `${region}, ${state}` : state;
}
