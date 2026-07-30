const SuperAdminController = require('../controllers/superAdmin/superAdminController');

async function test() {
  const req = {
    params: { id: 1 }
  };
  const res = {
    status(code) {
      console.log("Status code:", code);
      return this;
    },
    json(data) {
      console.log("JSON response data:", data);
      return this;
    }
  };
  const next = (err) => {
    console.error("Next called with error:", err);
  };

  try {
    console.log("Executing getClinicSettings controller handler...");
    await SuperAdminController.getClinicSettings(req, res, next);
    process.exit(0);
  } catch (err) {
    console.error("Caught error in outer block:", err);
    process.exit(1);
  }
}

test();
