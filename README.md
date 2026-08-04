Orbital Command
This is a live NASA data dashboard I built for the Hack Club Stardance challenge. It pulls real data from NASA APIs and shows it in one place instead of having to open multiple websites.
Live Demo
https://vihaan6119.github.io/Orbital-Command/
What It Shows
Cosmic Archive: Random astronomy pictures from NASA's archive
NEO Radar: Near-Earth asteroids tracked by NASA with distance and size info
APOD Explorer: Browse the last 7 days of NASA's Astronomy Picture of the Day
Solar System: Animated orbits of all planets at relative speeds
Mission Log: Save your own notes about space observations
System Status: Live telemetry-style readouts
How I Built It
I used HTML, CSS, and JavaScript. No frameworks. The design uses CSS grid and flexbox for the layout. The starfield in the background is an HTML5 canvas with 200 animated stars that respond to mouse movement.
All the data comes from NASA's free public APIs. I signed up for an API key at api.nasa.gov.
Devlog
Day 1: Built the starfield canvas and the basic layout with CSS grid.
Day 2: Added the sci-fi styling with Orbitron fonts and scanline effects.
Day 3: Integrated the NASA APIs for asteroids and astronomy pictures.
Day 4: Added the cosmic archive card with random APOD history.
Day 5: Built the solar system animation and mission log with localStorage.
Day 6: Fixed API issues, tested on mobile, and deployed to GitHub Pages.
Day 7: Wrote documentation and submitted to Stardance.
Data Sources
NASA NEO API (asteroid tracking)
NASA APOD API (astronomy pictures)
All data is real and updates automatically
Tech Stack
HTML5
CSS3 (Grid, Flexbox, Animations)
Vanilla JavaScript
NASA Open APIs
GitHub Pages for hosting
Built For
Hack Club Stardance Challenge 2026