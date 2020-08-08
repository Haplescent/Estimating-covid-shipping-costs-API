const axios = require("axios");

require("dotenv").config();

const apiKey = process.env.shipEngineApiKey;

const getHighestIncreaseCases = (jsonData) => {
  let stateData = Object.values(jsonData.data.regions);
  let stateToDeliver;
  let highestcases = 0;
  for (let i = 0; i < stateData.length; i++) {
    let cases = stateData[i].change.active_cases;
    if (cases > highestcases) {
      highestcases = cases;
      stateToDeliver = stateData[i].name;
    }
  }
  return stateToDeliver;
};

const getCovidState = () => {
  return new Promise((resolve, reject) => {
    let config = {
      method: "get",
      url:
        "https://api.quarantine.country/api/v1/summary/region?sub_areas=1&region=USA",
      headers: {
        Accept: "application/json",
      },
    };

    axios(config)
      .then(function (response) {
        let stateData = JSON.stringify(response.data);
        resolve(getHighestIncreaseCases(JSON.parse(stateData)));
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

const getCovidCity = (state) => {
  return new Promise((resolve, reject) => {
    let config = {
      method: "get",
      url: `https://api.quarantine.country/api/v1/summary/region?region=Texas&sub_areas=1`,
      headers: {
        Accept: "application/json",
      },
    };

    axios(config)
      .then(function (response) {
        let stateData = JSON.stringify(response.data);
        resolve(getHighestIncreaseCases(JSON.parse(stateData)));
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

const getCarriers = () => {
  return new Promise((resolve, reject) => {
    let config = {
      method: "get",
      url: "https://api.shipengine.com/v1/carriers",
      headers: {
        "API-Key": apiKey,
      },
    };

    axios(config)
      .then(function (response) {
        let carrierDataString = JSON.stringify(response.data);
        let carrierDataObject = JSON.parse(carrierDataString);
        let carriersData = [];
        carrierDataObject.carriers.forEach((carrier) => {
          carriersData.push({
            carrier_id: carrier.carrier_id,
            friendly_name: carrier.friendly_name,
          });
        });
        resolve(carriersData);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

const getPriceEstimate = ({ state, city, carrierID }) => {
  console.log(state, city, carrierID);
  return new Promise((resolve, reject) => {
    var data = JSON.stringify({
      carrier_ids: carrierID,
      from_country_code: "US",
      from_postal_code: "94107",
      to_country_code: "US",
      to_state_province: state,
      to_city_locality: city,
      weight: { value: 17, unit: "pound" },
    });

    var config = {
      method: "post",
      url: "https://api.shipengine.com/v1/rates/estimate?",
      headers: {
        "Content-Type": "application/json",
        "API-key": "TEST_ieNU2dFHUhXaJOp5N97izrLsdQFJVUYtYNYOoscSXqw",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        let carrierDataString = JSON.stringify(response.data);
        let carrierDataObject = JSON.parse(carrierDataString);
        let shippingData = [];
        carrierDataObject.forEach((shipment) => {
          try {
            shippingData.push({
              shipping_amount: shipment.shipping_amount,
              delivery_days: shipment.delivery_days,
              service_type: shipment.service_type,
            });
          } catch {
            console.log("not able to append data");
          }
        });
        resolve(shippingData);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

const getPriceForShipment = () => {
  return new Promise(async (resolve, reject) => {
    let carriersData = await getCarriers().catch((error) => {
      reject(error);
    });
    let carrierID = [];
    carriersData.forEach((carrier) => {
      carrierID.push(carrier.carrier_id);
    });
    let state = await getCovidState().catch((error) => {
      reject(error);
    });
    let city = await getCovidCity().catch((error) => {
      reject(error);
    });
    let priceArray = await getPriceEstimate({ state, city, carrierID }).catch(
      (error) => {
        reject(error);
      }
    );
    console.log({ state, city, priceArray });

    resolve({ state, city, priceArray });
  });
};

module.exports = getPriceForShipment;
