const axios = require("axios");

const calculateReward = async (coin, algo, mh) => {
  return axios
    .post("https://api.unminable.com/v3/calculate/reward", {
      algo,
      mh,
      coin,
    })
    .then((response) => {
      return response.data;
    });
};

const sendNotification = async (title, body) => {
  if (!process.env.PUSH_KEY) {
    return Promise.resolve();
  }

  return axios.get(
    `https://push.techulus.com/api/v1/notify/${process.env.PUSH_KEY}?title=${title}&body=${body}`
  );
};

module.exports = {
  calculateReward,
  sendNotification,
};
