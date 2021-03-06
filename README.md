# MEDReviews

MedReviews is a one-stop medical knowledge solution. More than 8 top websites power our medical knowledge, and our knowledge / data-gathering processes are completely autonomous.

#### Backend Hosted URL (Susmit Singh): https://medreviewsbackend.herokuapp.com/
#### Backend Postman Documentation (Susmit Singh): https://documenter.getpostman.com/view/15733171/UzJPMatY


## Folder Definition

There are 9 folders which control 9 integral parts of our application.
They are:

1. **GeoJSONGenerator** - This script will iterate over all the medical institutions' data that we have in our DB, and geocode their textual address to represent them on a map (MapBox).

2. **Sentimental Analysis_Reviews** - This folder contains the sentimental Analysis engine. The training, evaluating and testing API is all inside this 1 folder.

3. **correction code** - The advancements and changes that were later done to our database were driven through code in this module.

4. **data divider** - This module segregates and differentiates data for the sentimental engine to test and train on.

5. **geocoder** - This generates the coordinates and adds them to the medical institution's database. Will later be used by GeoJSONGenerator.

6. **hospital scraped** and review scraper - THESE ARE BY FAR THE MOST IMPORTANT FOLDER. Our state of art scraper scrapes hospital and reviews inside it. We have implemented advanced bot detection avoidance algorithms, as well as we mimic the functionality of a human being. This enabled us to generate over 2 lakh data points during the duration of the hack.

7. **SentimentalEngineRunner** - This automates and periodically runs the sentimental engine on the SUPPORTING DB, and manages the flow.

8. **Backend** - This is also ANOTHER EXTREMELY IMPORTANT folder. This contains the backend (MongoDB, NodeJS, Express) of the application. The Backend is a RESTful API backend.

## Contributions
Following are the contributions:

 #### SUSMIT SINGH
1. correction code
2. data divider
3. geocoder
4. hospital scraped
5. SentimentalEngineRunner
6. Backend
7.GeoJSONGenerator

#### VINJAMURI MANOJNA
1. Sentimental Analysis_Reviews

## Usage
Follow these steps: 

STEP 1: ```git clone <FILE>```


STEP 2: Goto each folder and type in the ```npm install``` command as each folder works on a different version of NPM


STEP3: Create a ```.env``` file in every folder with the following details:

```
PRODUCTION_DB_URL=<Your URL>
METADATA_DB_URL=<Your URL>
SUPPORTING_DB_URL=<Your URL>
ACCESS_TOKEN=<Mapbox access token>
SECRET=<secret used for encryption and decryption>
```

STEP4: Just type in the following command and enjoy!!!!! <3
```
cd backend
npm run start
```

## WARNING ????????????
This code is still developmental and some things might be broken.

Made with ?????? by Team Sumo
