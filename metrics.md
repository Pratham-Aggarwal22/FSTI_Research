# Metrics Documentation

## Methodology

### 1. Data Collection
The foundation of this research involved obtaining millions of addresses across all 50 states in the United States. These addresses were sourced from publicly available datasets. The goal was to create a comprehensive dataset that would serve as the input for transit accessibility analysis. Each address entry included fields such as the following: Street address or P.O. Box information, name of the county where the address is located, and full name of the state.

### 2. Data Processing
**2.1 File Loading and Consolidation**
To prepare the data for analysis, Python scripts were used to load and consolidate all files within each state directory. The consolidated dataset for each state was saved as a serialized .pkl file for efficient storage and retrieval.

**2.2 Filtering Invalid Addresses**
The raw data contained invalid or incomplete addresses like P.O. Boxes and SVL Boxes. Addresses with empty or null entries in the "Address Line 1" field were discarded. This iterative filtering process ensured that only valid and complete addresses remained.

**2.3 Manual County Name Standardization**
County names often contained inconsistencies, such as extra spaces, abbreviations, or alternative spellings. A separate file was used to: map incorrect county names to their correct versions and exclude records with invalid county names, based on specific criteria provided in the file.

**2.4 Random Sampling**
To reduce the dataset size for computational efficiency while maintaining representativeness, stratified random sampling was applied at the county level: for each county, a fixed percentage (0.05%) of records was selected, if the sample size was less than 150 records, at least 150 records were retained, and if the county had fewer than 150 records, all records were retained.

**2.5 Nationwide Consolidation**
The steps above were repeated for all 50 states. Each state's filtered and sampled dataset was consolidated into a master dataset, forming the basis for API integration and subsequent analysis. The final dataset contained: Thousands of valid, unique addresses across the U.S; Uniformly formatted county names; Representative samples for each county.

### 3. API Running
**3.1 Geocoding Optimization**
The geocoding phase involved converting address strings into precise geographic coordinates (latitude and longitude). This was achieved using the Google Maps Geocoding API. The optimized geocoding process was essential to ensure efficient handling of thousands of address records across all U.S. states.
*   **Output Metrics:** The output metrics include geocoded coordinates, stored in the format latitude,longitude. The geocode status is categorized as follows: OK for successful geocoding, ZERO_RESULTS when no match is found for the address, and OVER_QUERY_LIMIT when the API quota is exceeded.

**3.2 Place Search**
The place search phase identified the nearest courthouses to each geocoded address within a 40,000-meter radius. The Google Places Nearby Search API was utilized to retrieve these points of interest.
*   **Input Parameters:** type: court_of_law to filter results to courthouses and keyword: local court of law to refine the search.
*   **Output metrics:** include courthouse coordinates, stored as arrays of up to five locations, and their corresponding addresses. The place search status is categorized as follows: OK for successful retrieval of courthouses and ZERO_RESULTS when no courthouses are found within the radius.

**3.3 Transit Calculations**
Using the Google Directions API, transit metrics were calculated for trips between residential addresses and the nearest courthouses.
*   **Input Parameters:** origin (address coordinates), destination (coordinates of each courthouse), mode (transit), and departure time (fixed epoch time for consistency).
*   **Metrics Derived:** travel duration (total trip duration in seconds), initial wait time (time from trip start to first transit leg departure), initial walk distance (distance to the first transit stop), in-vehicle duration (time spent in transit vehicles), out-of-vehicle duration (total time spent walking or waiting), and transfers (number of mode changes during the trip).

**3.4 Driving Calculations**
The driving phase calculated metrics for trips between residential addresses and courthouses using the Google Directions API.
*   **Input Parameters:** origin (address coordinates), destination (courthouse coordinates), and departure time (fixed epoch time for consistency).
*   **Metrics Derived:** driving distance (total distance in meters), driving duration (total trip duration in seconds), and driving duration with traffic (duration considering traffic conditions).

### 4. Matrices Calculated
Non-numeric values (e.g., "No Access") were converted to NaN. Durations were converted from seconds to minutes, and walk distances from meters to miles.

**Derived Metrics**
1.  **Total Transit Duration** = Travel duration + Waiting time + Walking time (minutes).
2.  **Transit-to-Driving Ratio** = Total Transit Duration / Driving Duration (minutes).
3.  **In-Vehicle to Out-of-Vehicle Ratio** = In-Vehicle Duration / Out-of-Vehicle Duration (minutes).
4.  **Percent Access** = (Addresses meeting criteria / Sample Size) × 100.
    *   **Access Criteria:** (1) walk distance < 4 miles and (2) wait time < 60 minutes.

---

## Detailed Metric Explanations

### Transit Metrics
These metrics measure the quality and accessibility of public transit systems.

#### 1. Percent Access
*   **Formula:** `(Addresses meeting criteria / Sample Size) * 100`
*   **Criteria:**
    *   Initial walk distance < 4 miles
    *   Initial wait time < 60 minutes
*   **Simple Explanation:** This tells us the percentage of people in an area who can reasonably use public transit to reach a courthouse. "Reasonable" means they don't have to walk more than 4 miles to the first stop or wait more than an hour for the bus/train.
*   **Note on Averages:** For all subsequent average metrics (like wait time, duration), we ONLY calculate the average for the addresses that met this "Percent Access" criteria. Addresses with no access are excluded from the average calculation to avoid skewing the data with "zeros" or invalid trips.

#### 2. Sample Size
*   **Definition:** The total number of valid residential addresses selected for analysis in a specific area (county or state).
*   **Simple Explanation:** This is the number of households we checked. A higher sample size generally means the data is more reliable.

#### 3. Average Initial Wait Time
*   **Unit:** Minutes
*   **Simple Explanation:** On average, how long does a person have to wait at the bus stop or train station before their ride arrives? Lower is better.

#### 4. Average Initial Walk Distance
*   **Unit:** Miles
*   **Simple Explanation:** On average, how far does a person have to walk from their home to reach the first transit stop? Lower is better.

#### 5. Average Travel Duration (Total Transit Duration)
*   **Unit:** Minutes
*   **Formula:** Total time from leaving home to arriving at the destination (Walking + Waiting + Riding).
*   **Simple Explanation:** How long does the entire trip take using public transit? This includes walking, waiting, and riding.

#### 6. Average Driving Duration
*   **Unit:** Minutes
*   **Simple Explanation:** How long would the same trip take if the person drove a car instead? This is used as a baseline to compare transit efficiency.

#### 7. Transit-to-Driving Ratio
*   **Formula:** `Total Transit Duration / Driving Duration`
*   **Simple Explanation:** This compares transit time to driving time.
    *   A ratio of **1.0** means transit takes the same amount of time as driving.
    *   A ratio of **2.0** means transit takes twice as long as driving.
    *   Lower is better.

#### 8. In-Vehicle to Out-of-Vehicle Ratio
*   **Formula:** `In-Vehicle Duration / Out-of-Vehicle Duration`
*   **Simple Explanation:** This compares time spent *moving* in a bus/train versus time spent *waiting or walking*.
    *   A high ratio means you spend most of your trip actually moving towards your destination.
    *   A low ratio means you spend a lot of time waiting or walking relative to the ride itself.

#### 9. Average Transfers
*   **Unit:** Number of transfers
*   **Simple Explanation:** On average, how many times does a passenger have to switch buses or trains during their trip? Fewer transfers are generally preferred by riders.

#### 10. Average Initial Walk Duration
*   **Unit:** Minutes
*   **Simple Explanation:** The time spent walking from the origin (home) to the very first transit stop.

#### 11. Average Total Walk Duration
*   **Unit:** Minutes
*   **Simple Explanation:** The total time spent walking during the entire trip, including walking to the first stop, walking between transfers, and walking to the final destination.

#### 12. Average Total Walk Distance
*   **Unit:** Miles
*   **Simple Explanation:** The total distance walked during the entire trip.

#### 13. Average Total Wait Duration
*   **Unit:** Minutes
*   **Simple Explanation:** The total time spent waiting during the entire trip, including the initial wait and waiting for transfers.

#### 14. Average Out-of-Vehicle Duration
*   **Unit:** Minutes
*   **Formula:** Total Walk Duration + Total Wait Duration.
*   **Simple Explanation:** The total time spent *outside* of a vehicle (walking or waiting).

#### 15. Average In-Vehicle Duration
*   **Unit:** Minutes
*   **Simple Explanation:** The total time spent physically riding inside a bus, train, or other transit vehicle.

---

### Frequency Metrics
Frequency metrics show the *distribution* of accessibility. Instead of just an average, they show what percentage of people fall into different "bins" or ranges.

*   **Key Difference:** Unlike the average metrics, frequency distributions are calculated on **ALL** sampled addresses, not just those meeting the "Percent Access" criteria. This provides a complete picture of the service levels across the entire population.
*   **Bins:** Common ranges include `0-15`, `15-30`, `30-45`, `45-60`, and `>60` minutes (or miles for distance).
*   **State vs. County:**
    *   **County Level:** Frequencies represent the distribution of residents *within* that single county.
    *   **State Level:** Frequencies represent the distribution across the *entire* state, aggregating data from all counties.

**List of Frequency Metrics:**
*   Frequency - In-Vehicle Travel Time in Minutes
*   Frequency - In-Vehicle to Out-of-Vehicle Time Ratio
*   Frequency - Initial Wait Time in Minutes
*   Frequency - Initial Walk Distance in Miles
*   Frequency - Initial Walk Time in Minutes
*   Frequency - Out-of-Vehicle Travel Time in Minutes
*   Frequency - Total Wait Time in Minutes
*   Frequency - Total Walk Distance in Miles
*   Frequency - Total Walk Time in Minutes
*   Frequency - Number of Transfers
*   Frequency - Transit to Car Travel Time Ratio

---

### Equity Metrics
Equity metrics help us understand *who* is being served by the transit system. These are sourced from Census data (e.g., American Community Survey). Below is the complete list of every equity metric available in the system.

#### 1. Employment Data
*   **Total Employment Population:** The total number of people in the labor force context.
*   **Total Male Employment Population:** Total male population considered for employment statistics.
*   **Males Enrolled in School:** Males currently attending school.
*   **Unemployed Males Enrolled in School:** Males in school who are actively seeking work but unemployed.
*   **Employed Males Enrolled in School:** Males in school who also have a job.
*   **Males Enrolled in School Not in Labor Force:** Males in school who are not seeking work.
*   **Males Not Enrolled in School:** Males who are not currently attending school.
*   **Male High School Graduates:** Males not in school who have a high school diploma (or equivalent).
*   **Employed Male High School Graduates:** Male high school graduates who have a job.
*   **Unemployed Male High School Graduates:** Male high school graduates seeking work.
*   **Male High School Graduates Not in Labor Force:** Male high school graduates not seeking work.
*   **Males Without High School Diploma:** Males not in school who do not have a diploma.
*   **Employed Males Without High School Diploma:** Males without a diploma who have a job.
*   **Unemployed Males Without High School Diploma:** Males without a diploma seeking work.
*   **Males Without High School Diploma Not in Labor Force:** Males without a diploma not seeking work.
*   **Total Female Employment Population:** Total female population considered for employment statistics.
*   **Females Enrolled in School:** Females currently attending school.
*   **Employed Females Enrolled in School:** Females in school who also have a job.
*   **Unemployed Females Enrolled in School:** Females in school who are actively seeking work.
*   **Females Enrolled in School Not in Labor Force:** Females in school not seeking work.
*   **Females Not Enrolled in School:** Females who are not currently attending school.
*   **Female High School Graduates:** Females not in school who have a high school diploma.
*   **Employed Female High School Graduates:** Female high school graduates who have a job.
*   **Unemployed Female High School Graduates:** Female high school graduates seeking work.
*   **Female High School Graduates Not in Labor Force:** Female high school graduates not seeking work.
*   **Employed Females Without High School Diploma:** Females without a diploma who have a job.
*   **Females Without High School Diploma:** Females not in school who do not have a diploma.
*   **Unemployed Females Without High School Diploma:** Females without a diploma seeking work.
*   **Females Without High School Diploma Not in Labor Force:** Females without a diploma not seeking work.

#### 2. Income Data
*   **Total Population for Poverty Assessment:** The base population used to calculate poverty statistics.
*   **Population Below Federal Poverty Line:** Number of people living below the official poverty threshold.
*   **Population Above Federal Poverty Line:** Number of people living above the official poverty threshold.
*   **Children in Poverty (Under 18 Years):** Number of children living below the poverty line.
*   **Adults in Poverty (18 Years and Over):** Number of adults living below the poverty line.
*   **Median Household Income:** The income amount that divides the income distribution into two equal groups, half having income above that amount, and half having income below that amount.
*   **Income Inequality Index (Gini Coefficient):** A measure of income inequality where 0 represents perfect equality and 1 represents perfect inequality.

#### 3. Race Data
*   **Total Population:** The total population count for the area.
*   **Single-Race Population:** People who identify as one race only.
*   **White Population:** People identifying as White.
*   **Black or African American Population:** People identifying as Black or African American.
*   **American Indian and Alaska Native Population:** People identifying as American Indian or Alaska Native.
*   **Asian Population:** People identifying as Asian.
*   **Native Hawaiian and Pacific Islander Population:** People identifying as Native Hawaiian or Other Pacific Islander.
*   **Other Race Population:** People identifying as "Some Other Race".

#### 4. Housing Data
*   **Total Household Population:** Total number of households.
*   **Individuals Living Alone:** Number of people living alone.
*   **Households with Spouse:** Households where the householder lives with a spouse.
*   **Households with Unmarried Partner:** Households where the householder lives with an unmarried partner.
*   **Children in Household:** Households containing children of the householder.
*   **Other Household Relatives:** Households containing other relatives.
*   **Non-Relatives in Household:** Households containing non-relatives.
*   **Age 18-34 Years Household Population:** Total households where householder is 18-34.
*   **Single Occupants Age 18-34:** People 18-34 living alone.
*   **Married Householders Age 18-34:** Married householders aged 18-34.
*   **Unmarried Householders Age 18-34:** Unmarried householders aged 18-34.
*   **Children in Households Age 18-34:** Children in households where householder is 18-34.
*   **Other Relatives in Household Age 18-34:** Other relatives in households where householder is 18-34.
*   **Non-Relatives in Household Age 18-34:** Non-relatives in households where householder is 18-34.
*   **Age 35-64 Years Household Population:** Total households where householder is 35-64.
*   **Single Occupants Age 35-64:** People 35-64 living alone.
*   **Married Householders Age 35-64:** Married householders aged 35-64.
*   **Unmarried Householders Age 35-64:** Unmarried householders aged 35-64.
*   **Children in Households Age 35-64:** Children in households where householder is 35-64.
*   **Other Relatives in Household Age 35-64:** Other relatives in households where householder is 35-64.
*   **Non-Relatives in Household Age 35-64:** Non-relatives in households where householder is 35-64.
*   **Age 65+ Years Household Population:** Total households where householder is 65 or older.
*   **Single Occupants Age 65+:** People 65+ living alone.
*   **Married Householders Age 65+:** Married householders aged 65+.
*   **Unmarried Householders Age 65+:** Unmarried householders aged 65+.
*   **Children in Households Age 65+:** Children in households where householder is 65+.
*   **Other Relatives in Household Age 65+:** Other relatives in households where householder is 65+.
*   **Non-Relatives in Household Age 65+:** Non-relatives in households where householder is 65+.
