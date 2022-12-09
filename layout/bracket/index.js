(($) => {
  var ASSET_TO_USE = "full";
  var ZOOM = 2;

  gsap.config({ nullTargetWarn: false, trialWarn: false });

  let startingAnimation = gsap.timeline({ paused: true });

  function Start() {
    startingAnimation.restart();
  }

  var data = {};
  var oldData = {};

  async function Update() {
    oldData = data;
    data = await getData();

    if (
      !oldData.bracket ||
      JSON.stringify(data.bracket.bracket) !=
        JSON.stringify(oldData.bracket.bracket)
    ) {
      let bracket = data.bracket.bracket.rounds;
      let players = data.bracket.players.slot;

      let progressionsOut = data.bracket.bracket.progressionsOut;
      let progressionsIn = data.bracket.bracket.progressionsIn;

      let biggestRound = Math.max.apply(
        null,
        Object.values(bracket).map((r) => Object.keys(r.sets).length)
      );
      console.log(biggestRound);

      let size = 32;
      $(":root").css("--player-height", size);

      while (
        biggestRound * (2 * parseInt($(":root").css("--player-height")) + 2) >
        $(window).height() / 2
      ) {
        console.log("repeat");
        size -= 1;
        $(":root").css("--player-height", size);
      }
      $(":root").css("--name-size", Math.min(size - size * 0.3, 16));
      $(":root").css("--score-size", size - size * 0.3);
      $(":root").css("--flag-height", size - size * 0.4);

      let html = "";

      let winnersRounds = Object.fromEntries(
        Object.entries(bracket).filter(([round]) => parseInt(round) > 0)
      );

      Object.entries(winnersRounds).forEach(([roundKey, round], r) => {
        // Winners cutout
        if (progressionsOut > 0) {
          // Winners right side cutout
          let progressionsWinners = Math.pow(
            2,
            parseInt(Math.log2(progressionsOut / 2))
          );
          let cutOut = parseInt(Math.log2(progressionsWinners)) + 1;
          if (parseInt(roundKey) + cutOut >= Object.keys(winnersRounds).length)
            return;
        }

        // Winners left side cutout
        if (progressionsIn > 0) {
          if (parseInt(roundKey) == 1) return;

          if (!powerOf2(progressionsIn)) {
            if (parseInt(roundKey) == 2) return;
          }
        }

        html += `<div class="round round_${r}">`;
        html += `<div class="round_name"></div>`;
        Object.values(round.sets).forEach((slot, i) => {
          html += `<div class="slot slot_${i + 1}">`;
          Object.values(slot.playerId).forEach((playerId, p) => {
            html += `
              <div class="p_${playerId} slot_p_${p} player container">
                <div class="icon avatar"></div>
                <div class="icon online_avatar"></div>
                <div class="name_twitter">
                <div class="name"></div>
                </div>
                <div class="sponsor_icon"></div>
                <div class="flags">
                  <div class="flagcountry"></div>
                  <div class="flagstate"></div>
                </div>
                <div class="character_container"></div>
                <div class="score">0</div>
              </div>
            `;
          });
          html += "</div>";
        });
        html += "</div>";
      });

      $(".winners_container").html(html);

      html = "";

      let losersRounds = Object.fromEntries(
        Object.entries(bracket).filter(([round]) => parseInt(round) < 0)
      );

      Object.entries(losersRounds).forEach(([roundKey, round], r) => {
        // Losers cutout
        if (progressionsOut > 0) {
          // Losers right side cutout
          let progressionsLosers =
            progressionsOut -
            Math.pow(2, parseInt(Math.log2(progressionsOut / 2)));
          let cutOut = parseInt(Math.log2(progressionsLosers)) * 2 - 1;
          if (
            Math.abs(parseInt(roundKey)) + cutOut >=
            Object.keys(losersRounds).length
          )
            return;
        }

        // Losers left side cutout
        let cutOut = 2;

        // Losers R1 has total_players/2 sets. If more than half of losers R1 players are byes,
        // it's an auto win for all players and R1 doesn't exist
        let byes =
          nextPow2(Object.keys(players).length) - Object.keys(players).length;
        if (
          progressionsIn == 0 &&
          byes > 0 &&
          byes / 2 > Object.keys(players).length / 4
        )
          cutOut += 1;

        if (progressionsIn > 0 && !powerOf2(progressionsIn)) cutOut += 1;
        if (Math.abs(parseInt(roundKey)) <= cutOut) return;

        html += `<div class="round round_${r}">`;
        html += `<div class="round_name"></div>`;
        Object.values(round.sets).forEach((slot, i) => {
          html += `<div class="slot slot_${i + 1}">`;
          Object.values(slot.playerId).forEach((playerId, p) => {
            html += `
              <div class="p_${playerId} slot_p_${p} player container">
                <div class="icon avatar"></div>
                <div class="icon online_avatar"></div>
                <div class="name_twitter">
                <div class="name"></div>
                </div>
                <div class="sponsor_icon"></div>
                <div class="flags">
                  <div class="flagcountry"></div>
                  <div class="flagstate"></div>
                </div>
                <div class="character_container"></div>
                <div class="score">0</div>
              </div>
            `;
          });
          html += "</div>";
        });
        html += "</div>";
      });

      $(".losers_container").html(html);

      let slotLines = "";

      let baseClass = "winners_container";

      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        if (parseInt(roundKey) < 0) {
          baseClass = "losers_container";
        } else {
          baseClass = "winners_container";
        }

        console.log(round.name);

        SetInnerHtml(
          $(
            `.${baseClass} .round_${
              Math.abs(parseInt(roundKey)) - 1
            } .round_name`
          ),
          round.name
        );

        Object.values(round.sets).forEach(
          function (slot, i) {
            Object.values(slot.score).forEach(
              function (score, p) {
                SetInnerHtml(
                  $(
                    `.${this.baseClass} .round_${
                      Math.abs(parseInt(roundKey)) - 1
                    } .slot_${i + 1} .slot_p_${p}.container .score`
                  ),
                  `
                ${score == -1 ? "DQ" : score}
              `,
                  undefined,
                  0
                );
              },
              { baseClass: baseClass }
            );
            if (slot.score[0] > slot.score[1]) {
              $(
                `.${this.baseClass} .round_${
                  Math.abs(parseInt(roundKey)) - 1
                } .slot_${i + 1} .slot_p_${1}.container`
              ).css("filter", "brightness(0.6)");
            } else if (slot.score[1] > slot.score[0]) {
              $(
                `.${this.baseClass} .round_${
                  Math.abs(parseInt(roundKey)) - 1
                } .slot_${i + 1} .slot_p_${0}.container`
              ).css("filter", "brightness(0.6)");
            }

            let lastLosers =
              parseInt(roundKey) ==
              Math.min.apply(
                null,
                Object.keys(bracket).map((r) => parseInt(r))
              );

            if (
              slot.nextWin &&
              !lastLosers &&
              !(
                slot.playerId[0] > Object.keys(players).length ||
                slot.playerId[1] > Object.keys(players).length ||
                slot.playerId[0] == -1 ||
                slot.playerId[1] == -1
              )
            ) {
              let slotElement = $(
                `.${this.baseClass} .round_${
                  Math.abs(parseInt(roundKey)) - 1
                } .slot_${i + 1}`
              );
              let winElement = $(
                `.${this.baseClass} .round_${
                  Math.abs(slot.nextWin[0]) - 1
                } .slot_${slot.nextWin[1] + 1}`
              );

              if (
                slotElement &&
                slotElement.offset() &&
                winElement &&
                winElement.offset()
              ) {
                console.log(slotElement.offset());

                slotLines += `<path class="${this.baseClass} r_${Math.abs(
                  roundKey
                )} s_${i + 1}" d="
                M${[
                  slotElement.offset().left + slotElement.width(),
                  slotElement.offset().top + slotElement.height() / 2,
                ].join(" ")}
                ${[
                  [
                    slotElement.offset().left +
                      slotElement.width() +
                      (winElement.offset().left -
                        (slotElement.offset().left + slotElement.width())) /
                        2,
                    slotElement.offset().top + slotElement.height() / 2,
                  ],
                  [
                    slotElement.offset().left +
                      slotElement.width() +
                      (winElement.offset().left -
                        (slotElement.offset().left + slotElement.width())) /
                        2,
                    winElement.offset().top + slotElement.height() / 2,
                  ],
                  [
                    winElement.offset().left,
                    winElement.offset().top + winElement.height() / 2,
                  ],
                ]
                  .map((point) => point.join(" "))
                  .map((point) => "L" + point)
                  .join(" ")}"
                stroke="black" fill="none" stroke-width="2" />`;
              }
            }

            if (
              slot.playerId[0] > Object.keys(players).length ||
              slot.playerId[1] > Object.keys(players).length ||
              slot.playerId[0] == -1 ||
              slot.playerId[1] == -1
            ) {
              $(
                `.${this.baseClass} .round_${
                  Math.abs(parseInt(roundKey)) - 1
                } .slot_${i + 1} .slot_p_0.container`
              ).css("opacity", "0");
              $(
                `.${this.baseClass} .round_${
                  Math.abs(parseInt(roundKey)) - 1
                } .slot_${i + 1} .slot_p_1.container`
              ).css("opacity", "0");
            }
          },
          { baseClass: baseClass }
        );
      });

      $(".lines").html(slotLines);

      Object.values(players).forEach((slot, t) => {
        Object.values(slot.player).forEach((player, p) => {
          if (player) {
            SetInnerHtml(
              $(`.p_${t + 1}.container .name`),
              `
                <span>
                  <span class="sponsor">
                    ${player.team ? player.team : ""}
                  </span>
                  ${player.name}
                </span>
              `,
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1}.container .flagcountry`),
              player.country.asset
                ? `<div class='flag' style='background-image: url(../../${player.country.asset.toLowerCase()})'></div>`
                : "",
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1}.container .flagstate`),
              player.state.asset
                ? `<div class='flag' style='background-image: url(../../${player.state.asset})'></div>`
                : "",
              undefined,
              0
            );

            let charactersHtml = "";

            Object.values(player.character).forEach((character, index) => {
              if (character.assets[ASSET_TO_USE]) {
                charactersHtml += `
                  <div class="icon stockicon">
                      <div
                        style='background-image: url(../../${
                          character.assets[ASSET_TO_USE].asset
                        })'
                        data-asset='${JSON.stringify(
                          character.assets[ASSET_TO_USE]
                        )}'
                        data-zoom='${ZOOM}'
                      >
                      </div>
                  </div>
                  `;
              }
            });
            SetInnerHtml(
              $(`.p_${t + 1} .character_container`),
              charactersHtml,
              undefined,
              0,
              () => {
                $(
                  `.p_${
                    t + 1
                  }.container .character_container .icon.stockicon div`
                ).each((e, i) => {
                  if (
                    player.character[1] &&
                    player.character[1].assets[ASSET_TO_USE] != null
                  ) {
                    CenterImage(
                      $(i),
                      $(i).attr("data-asset"),
                      $(i).attr("data-zoom"),
                      { x: 0.5, y: 0.5 },
                      $(i).parent().parent()
                    );
                  }
                });
              }
            );

            SetInnerHtml(
              $(`.p_${t + 1}.container .sponsor_icon`),
              player.sponsor_logo
                ? `<div style='background-image: url(../../${player.sponsor_logo})'></div>`
                : "<div></div>",
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1} .avatar`),
              player.avatar
                ? `<div style="background-image: url('../../${player.avatar}')"></div>`
                : "",
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1} .online_avatar`),
              player.online_avatar
                ? `<div style="background-image: url('${player.online_avatar}')"></div>`
                : '<div style="background: gray)"></div>',
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1}.container .twitter`),
              player.twitter
                ? `<span class="twitter_logo"></span>${String(player.twitter)}`
                : "",
              undefined,
              0
            );

            SetInnerHtml(
              $(`.p_${t + 1}.container .sponsor-container`),
              `<div class='sponsor-logo' style='background-image: url(../../${player.sponsor_logo})'></div>`,
              undefined,
              0
            );
          }
        });

        gsap.from(
          $(`.round_${t} .slot`),
          { x: -50, autoAlpha: 0, duration: 0.4 },
          0.5 + 0.4 * t
        );

        let elements = $(`.r_${t}`);

        elements.each((index, element) => {
          if (element) {
            let length = element.getTotalLength();
            gsap.from(
              element,
              {
                duration: 0.4,
                "stroke-dashoffset": length,
                "stroke-dasharray": length,
                onUpdate: function (tl) {
                  let tlp = (this.progress() * 100) >> 0;
                  if (element) {
                    let length = element.getTotalLength();
                    TweenMax.set(element, {
                      "stroke-dashoffset": (length / 100) * (100 - tlp),
                      "stroke-dasharray": length,
                    });
                  }
                },
                onUpdateParams: ["{self}"],
              },
              0.4 + 0.4 * t
            );
          }
        });
      });
    }

    $(".text").each(function (e) {
      FitText($($(this)[0].parentNode));
    });
  }

  Update();
  $(window).on("load", () => {
    $("body").fadeTo(1000, 1000, async () => {
      Start();
      setInterval(Update, 16);
    });
  });
})(jQuery);
