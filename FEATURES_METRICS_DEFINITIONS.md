# Metric Definitions & Glossary

## 1. Transit Metrics

### Simple English Explanation
These metrics measure the quality and speed of public transportation. They tell us how easy or hard it is for people to get around without a car.

*   **Percent Access:** The percentage of people who can easily walk to a stop (less than 4 miles) and don't have to wait too long (less than an hour). A higher number is better.
*   **Transit to Car Ratio:** How much longer does it take to take the bus compared to driving?
    *   *Example:* A score of **2.0** means the bus takes **twice as long** as driving. We want this number to be as close to 1.0 as possible.
*   **Initial Wait Time:** How many minutes you stand at the bus stop before your ride comes.
*   **Initial Walk Distance:** How far you have to walk from your house to get to the first bus or train stop.
*   **Number of Transfers:** How many times you have to switch vehicles. Zero is best; switching is annoying and takes time.
*   **Total Walk Time:** The total minutes you spend walking during your entire trip (walking to the stop + walking between transfers + walking to your final destination).

### Technical Explanations

#### Efficiency Metrics
*   **Transit to Car Travel Time Ratio**: $\frac{\text{Transit Duration}}{\text{Car Duration}}$. Stored as `transit_car_ratio`. Values $>1.0$ indicate transit is slower.
*   **In-Vehicle to Out-of-Vehicle Ratio**: $\frac{\text{Time Inside Vehicle}}{\text{Walking + Waiting Time}}$. A measure of "moving efficiency."

#### Accessibility Metrics
*   **Percent Access**: derived from query filters on the raw dataset: `count(trips where walk_dist < 4 AND wait_time < 60) / total_trips`.
*   **Initial Walk Distance**: Measured in **Miles**. Sourced from `initial_walk_dist`.
*   **Total Walk Time**: Measured in **Minutes**. Sum of `initial_walk_time` + `transfer_walk_time` + `destination_walk_time`.

#### Service Quality Metrics
*   **Initial Wait Time**: Measured in **Minutes**. Sourced from `initial_wait_time`. High variance in this metric often indicates poor schedule reliability.
*   **Number of Transfers**: Count of vehicle boardings minus one.

---

## 2. Equity Metrics

### Simple English Explanation
These metrics help us understand *who* lives in these areas. By comparing these with transit metrics, we can see if the system is fair.

*   **Median Household Income:** The "middle" income of a neighborhood. Half earn more, half earn less. Used to find wealthy vs. poor areas.
*   **Poverty Rate:** The percentage of people living below the poverty line.
*   **Employment Status:** Are people employed, unemployed, or not in the workforce?
*   **Gini Index:** A fancy score for "Inequality."
    *   *0* = Perfect equality (everyone has same income).
    *   *1* = Perfect inequality (one person has all the money).
*   **Race & Ethnicity:** Data showing the percentage of different racial groups living in an area.

### Technical Explanations
These metrics are sourced from the **US Census Bureau (ACS 5-Year Estimates)** and stored in separate MongoDB collections (`Employment_Data`, `Income_Data`, `Housing_Data`).

*   **Median Household Income**: Stored as integer values. Used frequently as the X-axis in scatter plots to demonstrate economic correlation.
*   **Gini Index**: A standard statistical measure of distribution. Range: $[0, 1]$. In our database, this is often stored under `Income_Data`.
*   **Data Joining**: These metrics are keyed by `FIPS` code (Federal Information Processing Standards), which allows us to perform exact joins with the transit data (which also uses FIPS codes).

