import { json } from "body-parser";
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import "express-async-errors";

import './db/mongoose';
import { authorized, errorHandler } from "./middlewares";
import { movieService } from "./services/movie-service";
import { tokenService } from "./services/token-service";
import { userService } from './services/user-service';

let app = express()
app.use(cors({
  origin: process.env.ALLOW_ORIGIN_HOST,
  credentials: true
}))

app.use(json())
app.get("/", async (req: Request, res: Response) => {
  res.send("Hello world.")
})

app.post('/api/sign-in', async (req, res) => {
  let { email, password } = req.body
  let user = await userService.findUserByEmail(email);
  let token: string;
  if (!user) {
    // new user
    await userService.createUser(email, password);
    token = tokenService.createAccessToken(email);
  } else {
    // existing user
    token = await userService.authenticateUser(email, password)
  }
  tokenService.sendRefreshToken(res, token);
  res.status(200).send({ data: { token } })
});

app.post('/api/movies', authorized, async (req, res) => {
  await movieService.createMovie(req.body.url, req.currentUser.email);
  res.status(201).send({});
});

app.get('/api/movies', async (req, res) => {
  let movies = await movieService.getMovies();
  res.send({ data: { movies } });
});

app.use(errorHandler)

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Chat app listening at http://localhost:${port}`)
})