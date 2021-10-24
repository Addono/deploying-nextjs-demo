import type { NextApiRequest, NextApiResponse } from "next";
import { BodyProps } from "../../components/Body";

let buildId = 0;

export default (_: NextApiRequest, res: NextApiResponse<BodyProps>) => {
  buildId += 1;

  res.status(200).json({
    time: Date.now().toString(),
    number: buildId,
  });
};
