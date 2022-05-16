import { SearchResponse } from "@opensearch-project/opensearch/api/types";
import { left, right } from "fp-ts/lib/Either";
import { Lens } from "monocle-ts";
import { extractInnerHits } from "../src/extract";
import { ApplicationError, StatusCodes } from "../src/http";
import { WithOrdinal } from "../src/model";

const notFound = new ApplicationError("Not found", [], StatusCodes.NOT_FOUND);
const baseBody: SearchResponse<WithOrdinal> = {
  took: 0,
  timed_out: false,
  _shards: { failed: 0, successful: 0, total: 0 },
  hits: {
    total: 0,
    hits: [
      {
        _index: "IndexName",
        _id: "Id",
        _source: {
          ordinal: 5,
        },
        inner_hits: {
          "info.balances": {
            hits: {
              total: 1,
              hits: [
                {
                  _index: "IndexName",
                  _id: "5",
                  _source: {
                    balance: 2901,
                  },
                },
              ],
            },
          },
        },
      },
    ],
  },
};

const outerHits = Lens.fromProp<SearchResponse<WithOrdinal>>()("hits");
const outerHitsEmpty = () => outerHits.modify((a) => ({ ...a, hits: [] }));

describe("extractHits", () => {
  it("should extract", async () => {
    const result = await extractInnerHits("info.balances", baseBody)();
    const expected = [{ outer: { ordinal: 5 }, inner: [{ balance: 2901 }] }];
    expect(result).toStrictEqual(right(expected));
  });

  it("should not extract when outer hits empty", async () => {
    const wrongBase = outerHitsEmpty()(baseBody);
    const result = await extractInnerHits("info.balances", wrongBase)();
    expect(result).toStrictEqual(left(notFound));
  });
});
