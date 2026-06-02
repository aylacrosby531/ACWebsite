// Supabase config — anon key is safe to ship to the browser
// because Row Level Security on the tables restricts access
// to OWNER_EMAIL only. If you change OWNER_EMAIL here, also
// update the policies in schema.sql to match.
window.AC_CONFIG = {
  SUPABASE_URL: "https://gtlczgyxbnsplcalhbgv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bGN6Z3l4Ym5zcGxjYWxoYmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTYyOTEsImV4cCI6MjA5NTk5MjI5MX0.X046XQGmZb9SLurzQY4pkIhob7UjlSoaF_sb4pRM4wo",

  OWNER_EMAIL: "jessealloy@gmail.com",

  PROFILE: {
    name: "Ayla Crosby",
    linkedin: "https://www.linkedin.com/in/ayla-crosby-3415023a5",
    tagline: "Environmental data + sustainability"
  },

  // Default keywords used by the job search APIs.
  JOB_KEYWORDS: [
    "environmental",
    "sustainability",
    "climate",
    "data science",
    "data analyst",
    "carbon"
  ]
};
