export default function handler(req, res) {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Product 1" },
      { id: 2, name: "Product 2" }
    ]
  });
}