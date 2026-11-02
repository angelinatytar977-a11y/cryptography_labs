const STUDENT = {
  firstName: "Anhelina",  
  lastName: "Tytar",      
  listNumber: 22,         
};

module.exports = {
  PORT: process.env.PORT || 3000,

 
  JWT_SECRET: STUDENT.firstName + STUDENT.lastName,

  TOKEN_LIFETIME: `${STUDENT.listNumber}m`,

  STUDENT,
};
