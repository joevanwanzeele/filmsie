/**
 * Allow any admin user.
 */
module.exports = function (req, res, ok) {

  // User is allowed, proceed to controller
  if (req.session.user && req.session.user.admin) return ok();
  return res.json("unauthorized");
};
