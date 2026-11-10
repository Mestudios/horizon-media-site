// The sports a studio photo can be filed under, grouped by season as on the homepage.
// The portfolio page shows a filter button for each sport that has photos.
export const SEASONS = [
  ["Fall", [["football", "Football"], ["soccer", "Soccer"], ["volleyball", "Volleyball"], ["cross-country", "Cross Country"]]],
  ["Winter", [["basketball", "Basketball"], ["wrestling", "Wrestling"], ["indoor-track", "Indoor Track"]]],
  ["Spring", [["lacrosse", "Lacrosse"], ["baseball", "Baseball"], ["softball", "Softball"], ["track-and-field", "Track & Field"]]],
  ["", [["other", "Other"]]],
];
export const SPORTS = SEASONS.flatMap(([, sports]) => sports.map(([value]) => value));
