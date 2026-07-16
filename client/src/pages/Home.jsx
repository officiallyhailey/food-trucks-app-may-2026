import "../App.css";
import React from "react";
import { useState, useEffect, useRef } from "react";

// Lucide icons used in the search bar, badge, and delete button - lucid is a free, open-source icon library for React. The icons are imported as React components and can be used directly in the JSX code. The size prop is used to set the size of the icons in pixels. Very cool discovery. 
import { Search, Award, Trash2 } from "lucide-react";

// Same "label: value" markup was repeated 6 times on every card, so pulled it out here.
// Renders as bare spans (not a <p>) so they act as grid cells in the parent
// .truck-fields grid - that's what actually lines the columns up and stops
// long values from overlapping the row below. I googled how to reduce redundant code lines and it suggested making a function once to make it easier to read and maintain. Overkill for a project this size but practice for large projects down the line.

function DetailRow({ label, value }) {
  return (
    <>
      <span className="dataLabel">{label}:</span>
      <span className="dataResponse">{value}</span>
    </>
  );
}

// returns a string of "💰" symbols based on the price level (1-5)
function getPriceSymbols(priceLevel) {
  return "💰".repeat(priceLevel); //repeat = pulls the number from the argument and repeats the string that many times.
}

// returns a string of "🌟" symbols based on the rating (0-5), rounded to the nearest whole number
function getStarSymbols(rating) {
  return "🌟".repeat(Math.round(Number(rating))); // math.round = rounds the number to the nearest whole number
}

// Shows a Top Rated badge if the rating is 4.5 or higher.

//size = sets the size of the Award icon to 14 pixels

function TopRatedBadge({ rating }) {
  if (Number(rating) < 4.5) return null; // if the rating is less than 4.5, the function returns null, meaning nothing will be rendered for this component. This effectively hides the badge for food trucks that don't meet the top-rated criteria.
  return (
    <span className="topRatedBadge">
      <Award size={14} />
      Top Rated
    </span>
  );
}

// Ticks the displayed number up/down to the new target instead of just snapping to it. Runs again every time target changes, so it re-animates on every search or delete. (found a codepen reference for inspiration)

//target, duration = 600 = target is the number that we want to animate to, and duration is the time it takes to animate to that number in milliseconds. The default value for duration is 600ms if no value is provided.

//useRef = used to create a mutable reference that persists across renders. In this case, it's used to store the previous target value so that we can animate from that value to the new target value.

//performance.now = returns the current time in milliseconds, with a high-resolution timer. It's used to calculate the progress of the animation based on the elapsed time since the animation started.

//math.min = used to ensure that the progress value does not exceed 1, which would indicate that the animation is complete. It takes the minimum of the calculated progress and 1.

// requestAnimationFrame = a browser API that schedules a function to be called before the next repaint. It's used here to create a smooth animation by updating the displayed count on each frame until the animation is complete.

// cancelAnimationFrame = a browser API that cancels a previously scheduled animation frame request. It's used here to clean up the animation when the component unmounts or when the target value changes, preventing memory leaks and unnecessary updates.



function useAnimatedCount(target, duration = 600) {
  const [displayCount, setDisplayCount] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current; // stores the previous target value in a variable called from, which is used as the starting point for the animation. This allows the animation to smoothly transition from the previous value to the new target value.
    const start = performance.now();// stores the current time in a variable called start, which is used to calculate the progress of the animation based on the elapsed time since the animation started.
    let frameId; // declares a variable called frameId, which will be used to store the ID of the animation frame request. This ID is needed to cancel the animation frame request if necessary.

    const tick = (now) => { // defined a function called tick with the current time (now) as an argument)
      const progress = Math.min((now - start) / duration, 1); // Calculate the progress of the animation as a value between 0 and 1
      setDisplayCount(Math.round(from + (target - from) * progress)); // Update the displayed count based on the progress of the animation
      if (progress < 1) { // If the animation is not yet complete...
        frameId = requestAnimationFrame(tick); // declares a variable called frameId, which will be used to store the ID of the animation frame request. This ID is needed to cancel the animation frame request if necessary.
      } else {
        fromRef.current = target; // Update the previous target value to the new target value once the animation is complete
      }
    };

    frameId = requestAnimationFrame(tick); // starts the animation by requesting the first animation frame and calling the tick function with the current time.
    return () => cancelAnimationFrame(frameId); // Cleans up the animation frame request if the component unmounts or if the target value changes, preventing memory leaks and unnecessary updates.
  }, [target, duration]); // The useEffect hook is set to run whenever the target or duration values change, ensuring that the animation updates accordingly.

  //useEffect hook = a React hook that allows you to perform side effects in functional components. In this case, it's used to handle the animation logic whenever the target or duration values change.

  return displayCount;
}

function Home() {
  // This is the real fetched list - search never touches it, so clearing the search box always brings everything back. yay!
  const [trucks, setTrucks] = useState([]);

  // Id of the truck currently in the "are you sure?" delete state.
  const [confirmingId, setConfirmingId] = useState(null);

  // Whatever's typed in the search box, lowercased so search isn't case sensitive.
  const [searchTerm, setSearchTerm] = useState("");

  // Stores the confirm-reset timer id so it can be cancelled early.
  const confirmTimeoutRef = useRef(null);

  // Sort state for the dropdown menu
  const [sortBy, setSortBy] = useState("none");

  // Fetches all trucks once on mount ([] dependency array).
  useEffect(() => {
 
    // Guards against setTrucks firing after unmount.
    
    //Unmount = when the component is removed from the DOM, so this prevents a memory leak warning if the user navigates away before the fetch finishes.
    
    //Memory leak = when a component tries to update state after it's unmounted, which can cause performance issues and unexpected behavior.
    
    //DOM = Document Object Model, the structure of the page in the browser
    
    let cancelled = false;

    const getTrucks = async () => {
      try {
        const response = await fetch("/api/get-all-food-trucks");
        const fetched = await response.json();
        if (!cancelled) setTrucks(fetched);
      } catch (error) {
        console.log("Failed to fetch food trucks:", error);
      }
    };

    getTrucks();

    return () => {
      cancelled = true;
    };
  }, []);

  // Clears any pending confirm-reset timer on unmount.
  useEffect(() => {
    return () => clearTimeout(confirmTimeoutRef.current);
  }, []);

  // Filtered by search only - order doesn't matter for a count.
  
  // filter = creates a new array with all elements that pass the test implemented by the provided function. In this case, it checks if the truck's name includes the search term (case-insensitive).

  //includes = checks if a string contains a specified substring. In this case, it checks if the truck's name (converted to lowercase) includes the search term (also in lowercase).

  const filteredTrucks = trucks.filter((truck) =>
    truck.name.toLowerCase().includes(searchTerm),
  );

  // Filtered + sorted - this is what actually gets rendered as cards.
  
  //sort((a, b) => { ... }) = sorts the filtered trucks array based on the selected sort option (price or rating). It compares two trucks at a time and determines their order in the sorted array.

  const visibleTrucks = [...filteredTrucks].sort((a, b) => {
    if (sortBy === "price") return a.price_level - b.price_level;
    if (sortBy === "rating") return Number(b.rating) - Number(a.rating);
    return 0;
  });

  const animatedCount = useAnimatedCount(filteredTrucks.length);

  return (
    <>
      <div className="pageHeader">
        <div className="titles">
          <h1>All Food Trucks</h1>
          <h2>
            Total Food Trucks: <span className="count">{animatedCount}</span>
          </h2>
        </div>

        <div className="controlsRow">
          <div className="searchBar">
            <Search className="searchIcon" size={18} />
            <input
              type="text"
              placeholder="Search food truck options..."
              onChange={(e) => {
                setSearchTerm(e.target.value.toLowerCase());
              }}
            />
          </div>

          <div className="sortDropdown">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="none">Sort by...</option>
              <option value="price">Price: Low to High</option>
              <option value="rating">Rating: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="truckGrid">
        {visibleTrucks.map((truck) => (
          <div className="truckCard" key={truck.id}>
            <TopRatedBadge rating={truck.rating} />

            <div className="truckDetails">
              <h3>{truck.name}</h3>

              <div className="truckFields">
                <DetailRow label="ID" value={truck.id} />
                <DetailRow label="Location" value={truck.current_location} />
                <DetailRow label="Slogan" value={truck.slogan} />
                <DetailRow
                  label="Vegan Options"
                  value={truck.has_vegan_options ? "✅" : "❌"}
                />
                <DetailRow label="Price Level" value={getPriceSymbols(truck.price_level)} />
                <DetailRow label="Rating" value={getStarSymbols(truck.rating)} />
              </div>
            </div>

            <div className="deleteWrapper">
              <button
                className={`deleteBtn${confirmingId === truck.id ? " confirming" : ""}`}
                title={
                  confirmingId === truck.id
                    ? "Click again to confirm delete"
                    : "Delete this food truck"
                }
                onClick={async () => {
                  // First click: set confirmation and start a 3s auto-reset timer.
                  if (confirmingId !== truck.id) {
                    setConfirmingId(truck.id);
                    clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => {
                      setConfirmingId(null);
                    }, 3000);
                    return;
                  }

                  // Second click: cancel the timer and send the real delete - goodbye forever!
                  clearTimeout(confirmTimeoutRef.current);
                  const response = await fetch(`/api/delete-one-food-truck/${truck.id}`, {
                    method: "POST", // matches server's app.post route
                  });
                  if (response.ok) {
                    setTrucks(trucks.filter((t) => t.id !== truck.id));
                  } else {
                    console.log("Failed to delete food truck:", truck.id);
                  }
                  setConfirmingId(null);
                }}
              >
                <Trash2 size={16} />
              </button>

              {/* Kept this always visible instead of relying on the title
                  tooltip - tooltips don't show up on phones anyway. */}
              {confirmingId === truck.id && (
                <span className="confirmMessage">Click again to delete</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Home;
