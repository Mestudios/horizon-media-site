// What a studio photo can be filed under: the sports, grouped by season as on the
// homepage, and cars. Car photos show on the car page; everything else on the portfolio.
export const SEASONS = [
  ["Fall", [["football", "Football"], ["soccer", "Soccer"], ["volleyball", "Volleyball"], ["cross-country", "Cross Country"]]],
  ["Winter", [["basketball", "Basketball"], ["wrestling", "Wrestling"], ["indoor-track", "Indoor Track"]]],
  ["Spring", [["lacrosse", "Lacrosse"], ["baseball", "Baseball"], ["softball", "Softball"], ["track-and-field", "Track & Field"]]],
  ["Cars", [["cars", "Cars (shows on the car page)"]]],
  ["", [["other", "Other"]]],
];
export const SPORTS = SEASONS.flatMap(([, sports]) => sports.map(([value]) => value));
