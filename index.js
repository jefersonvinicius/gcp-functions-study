exports.app = (req, res) => {
  console.log('requested_at ', new Date().toISOString());
  return res.send(':)');
};
