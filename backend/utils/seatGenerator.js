const generateSeatsForTrain = async (conn, trainId, totalSeats) => {
  const values = [];
  const placeholders = [];

  for (let i = 1; i <= totalSeats; i++) {
    values.push(trainId, `S1-${i}`);
    placeholders.push('(?, ?)');
  }

  const query = `
    INSERT INTO seats (train_id, seat_number)
    VALUES ${placeholders.join(',')}
  `;

  await conn.query(query, values);
};

module.exports = { generateSeatsForTrain };