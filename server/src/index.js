// ---------------------------------
// Boilerplate Code to Set Up Server
// ---------------------------------

import express from "express";
import pg from "pg";
import config from "./config.js";

const db = new pg.Pool({
  connectionString: config.databaseUrl + "&uselibpqcompat=true",
  ssl: true,
});

const app = express();
app.use(express.json());

const port = 3001;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// ---------------------------------
// Helper Functions
// ---------------------------------

// 1. getAllFoodTrucks()
async function getAllFoodTrucks() {
  const result = await db.query("SELECT * FROM food_trucks");
  return result.rows;
}

// 2. getFoodTruckById(id)
async function getFoodTruckById(id) {
  const result = await db.query("SELECT * FROM food_trucks WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
}

// 3. getVeganFoodTrucks()
// Gets all food trucks that offer vegan options
async function getVeganFoodTrucks() {
  const result = await db.query(
    "SELECT * FROM food_trucks WHERE has_vegan_options = true",
  );
  return result.rows; // array of truck objects with vegan options
}

// 4. getFoodTrucksByPrice(price)

//helper function to get food by price level - ranging from 1-5 as a scale with error handling to make sure user returns value between 1-5

async function getFoodTrucksByPrice(price) {

  // this line checks if the price level is less than 1 or greater than 5. If it is, an error is thrown with a message indicating that the price level must be between 1 and 5. This ensures that the function only processes valid price levels.

  if (price < 1 || price > 5) {

    // this line returns an error if the number is not between 1 and 5 

    throw new Error("Price level must be between 1 and 5");
  }

  // this line runs the sql query to return the trucks with the right price levels 

  const result = await db.query( 
    "SELECT * FROM food_trucks WHERE price_level = $1",
    [price], // the price is outside of the direct query line for security purposes 
  );
  return result.rows;
}

// 5. getTopRatedFoodTrucks()

async function getTopRatedFoodTrucks() {
  const result = await db.query(`
    SELECT *
    FROM food_trucks
    WHERE rating >= 4.5;
  `);

  return result.rows;
}

// 6. getFoodTrucksSortedByRating()

// Function to retrieve all food trucks from the database
// sorted by their rating from highest to lowest
async function getFoodTrucksSortedByRating() {
  //  a SQL query to select all food trucks
  // and order the results by the rating column in descending order
  const result = await db.query(
    "SELECT * FROM food_trucks ORDER BY rating DESC",
  );

  // Return only the rows containing the food truck data
  return result.rows;
}
// 7. getFoodTrucksSortedByPrice()
app.get("/get-food-trucks-sorted-by-price", async (req, res) => {
  const foodTrucks = await getFoodTrucksSortedByPrice();

  res.json(foodTrucks);
});
async function getFoodTrucksSortedByPrice() {
  const result = await db.query(
    "SELECT * FROM food_trucks ORDER BY price_level ASC"
  );

  return result.rows;
}


//     
// 8. getFoodTrucksCount()

// 9. addOneFoodTruck(...)
async function addOneFoodTruck(
  name,
  current_location,
  daily_special,
  slogan,
  has_vegan_options,
  price_level,
  rating,
) {
  const result = await db.query(
    `INSERT INTO food_trucks
    (name, current_location, daily_special, slogan, has_vegan_options, price_level, rating)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name,
      current_location,
      daily_special,
      slogan,
      has_vegan_options,
      price_level,
      rating,
    ],
  );

  return result.rows[0];
}

// 10. deleteOneFoodTruck(id)
async function deleteOneFoodTruck(id) {
  const result = await db.query(
    "DELETE FROM food_trucks WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
}

// 11. updateFoodTruckLocation(id, newLocation)
async function updateFoodTruckLocation(id, newLocation) {
  await db.query("UPDATE food_trucks SET current_location =$1 WHERE id = $2", [
    id,
    newLocation,
  ]);
}

// 12. updateFoodTruckRating(id, newRating)
async function updateFoodTruckRating(id, newRating) {
  const result = await db.query(`
    UPDATE food_trucks
    SET rating = $2
    WHERE id = $1
    RETURNING *`,
    [id, newRating]
  );
  return result.rows[0];
}
// ---------------------------------
// API Endpoints
// ---------------------------------

// 1. GET /get-all-food-trucks
app.get("/get-all-food-trucks", async (req, res) => {
  console.log("Route was hit!");
  const trucks = await getAllFoodTrucks();
  res.json(trucks);
});

// 2. GET /get-food-truck-by-id/:id - Carlotta
app.get("/get-food-truck-by-id/:id", async (req, res) => {
  const { id } = req.params;
  const truck = await getFoodTruckById(id);
  if (truck) {
    res.json(truck);
  } else {
    res.send(`Food truck with ID ${id} not found.`);
  }
});

// 3. GET /get-vegan-food-trucks - Jana

// 4. GET /get-food-trucks-by-price/:price - Hailey

app.get("/get-food-trucks-by-price/:price", async (req, res) => { 
  
  // app.get("/...) this is the endpoint for the GET request to retrieve food trucks by price level. The ":price" in the URL indicates that this is a route parameter, which will be extracted from the request and used in the function.

//async, (req, res) => { ... }) is an asynchronous function that takes in the request and response objects as parameters. This function will handle the logic for retrieving food trucks based on the price level specified in the route parameter.

  const { price } = req.params; // This line extracts the price parameter from the request's route parameters. The value of price will be used to query the database for food trucks that match the specified price level.

  try { 

// The try block is used to handle any potential errors that may occur during the execution of the code inside it. If an error occurs, the control will be passed to the catch block.

    const foodTrucks = await getFoodTrucksByPrice(price); 
    
    // This line calls the getFoodTrucksByPrice function, passing in the extracted price parameter. The function queries the database for food trucks that match the specified price level and returns the results. The await keyword is used to wait for the asynchronous operation to complete before proceeding.
   
    res.json(foodTrucks);
  
    // This line sends the retrieved food truck data as a JSON response to the client. If the operation is successful, the client will receive a JSON array of food trucks that match the specified price level.
  
  } catch (error) { 
    
    // The catch block is executed if an error occurs in the try block. It captures the error and allows you to handle it gracefully.
   
    res.status(400).json({ error: error.message });

    // This line sends an error response to the client with a status code of 400 (Bad Request) and includes the error message in the JSON response. This informs the client that there was an issue with their request, such as an invalid price level.

  }
});


// 6. GET /get-food-trucks-sorted-by-rating -  Morgan
// GET endpoint to retrieve all food trucks sorted by their rating
app.get("/get-food-trucks-sorted-by-rating", async (req, res) => {
  try {
    // Calls the helper function to get food trucks from the database
    // ordered from highest rating to lowest rating
    const foodTrucks = await getFoodTrucksSortedByRating();

    // Send a successful response (HTTP 200) with the food truck data as JSON
    res.status(200).json(foodTrucks);
  } catch (error) {
    // Logs the error in the server console for debugging
    console.error(error);

    // Send an error response (HTTP 500) if something goes wrong
    res.status(500).json({
      error: "Failed to retrieve food trucks.",
    });
  }
});
// 7. GET /get-food-trucks-sorted-by-price - Jana

// 8. GET /get-food-trucks-count - Meribel

// 9. POST /add-one-food-truck - Shirley
app.post("/add-one-food-truck", async (req, res) => {
  const {
    name,
    current_location,
    daily_special,
    slogan,
    has_vegan_options,
    price_level,
    rating,
  } = req.body;

  const truck = await addOneFoodTruck(
    name,
    current_location,
    daily_special,
    slogan,
    has_vegan_options,
    price_level,
    rating,
  );

  res.send(`Success! ${truck.name} was added!`);
});

// 10. POST /delete-one-food-truck/:id - Seth
app.post("/delete-one-food-truck/:id", async (req, res) => {
  const id = req.params.id;

  await deleteOneFoodTruck(id);
  res.send(`Success! Food truck ${id} was deleted.`);
});

// 12. POST /update-food-truck-rating - BONUS! - ZESTY
app.post("/update-food-truck-rating", async (req, res) => {
  const { id, rating } = req.body;
  const truck = await updateFoodTruckRating(id, rating);
  res.send(`Success! ${truck.name}'s rating was updated to ${truck.rating}.`);
});