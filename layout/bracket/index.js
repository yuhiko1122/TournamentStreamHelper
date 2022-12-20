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

  var entryAnim = gsap.timeline();
  var animations = {};

  function AnimateLine(element) {
    let anim = null;

    if (element && element.get(0)) {
      element = element.get(0);
      let length = element.getTotalLength();
      anim = gsap.from(
        element,
        {
          duration: 0.4,
          "stroke-dashoffset": length,
          "stroke-dasharray": length,
          opacity: 0,
          onUpdate: function (tl) {
            let tlp = (this.progress() * 100) >> 0;
            if (element) {
              let length = element.getTotalLength();
              TweenMax.set(element, {
                "stroke-dashoffset": (length / 100) * (100 - tlp),
                "stroke-dasharray": length,
                opacity: 1,
              });
            }
          },
          onUpdateParams: ["{self}"],
        },
        0
      );
    }

    return anim;
  }

  function AnimateElement(roundKey, setIndex, set) {
    if (animations[roundKey][setIndex]) {
      if (set.playerId[0] == -2 && set.playerId[1] == -2) {
        return animations[roundKey][setIndex].tweenTo("hidden");
      } else if (
        set.score[0] == set.score[1] ||
        set.playerId[0] == -2 ||
        set.playerId[1] == -2
      ) {
        return animations[roundKey][setIndex].tweenTo("displayed");
      } else {
        return animations[roundKey][setIndex].tweenTo("done");
      }
    }
    return null;
  }

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
        biggestRound * (2 * parseInt($(":root").css("--player-height")) + 4) >
        $(".winners_container").height() - 20
      ) {
        size -= 1;
        $(":root").css("--player-height", size);
      }
      $(":root").css("--name-size", Math.min(size - size * 0.3, 16));
      $(":root").css("--score-size", size - size * 0.3);
      $(":root").css("--flag-height", size - size * 0.4);

      if (
        !oldData.bracket ||
        oldData.bracket.bracket.length != data.bracket.bracket.length
      ) {
        // WINNERS SIDE
        let html = "";

        let winnersRounds = Object.fromEntries(
          Object.entries(bracket).filter(([round]) => parseInt(round) > 0)
        );

        Object.entries(winnersRounds).forEach(([roundKey, round], r) => {
          html += `<div class="round round_${roundKey}">`;
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

        // LOSERS SIDE
        html = "";

        let losersRounds = Object.fromEntries(
          Object.entries(bracket).filter(([round]) => parseInt(round) < 0)
        );

        Object.entries(losersRounds).forEach(([roundKey, round], r) => {
          html += `<div class="round round_${roundKey}">`;
          html += `<div class="round_name"></div>`;
          Object.values(round.sets).forEach((slot, i) => {
            html += `<div class="slot slot_${i + 1}">`;
            Object.values(slot.playerId).forEach((playerId, p) => {
              html += `
                <div class="slot_p_${p} player container">
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

        // BRACKET LINES
        // .line_r_(round) = Line going from (round) set to the next set
        let slotLines = "";

        let baseClass = "winners_container";

        Object.entries(bracket).forEach(function ([roundKey, round], r) {
          if (parseInt(roundKey) < 0) {
            baseClass = "losers_container";
          } else {
            baseClass = "winners_container";
          }

          Object.values(round.sets).forEach(
            function (slot, i) {
              let lastLosers =
                parseInt(roundKey) ==
                Math.min.apply(
                  null,
                  Object.keys(bracket).map((r) => parseInt(r))
                );

              if (
                slot.nextWin &&
                !(
                  slot.playerId[0] > Object.keys(players).length ||
                  slot.playerId[1] > Object.keys(players).length ||
                  slot.playerId[0] == -1 ||
                  slot.playerId[1] == -1
                )
              ) {
                let slotElement = $(
                  `.${this.baseClass} .round_${roundKey} .slot_${i + 1}`
                );

                if (!slotElement || !slotElement.offset()) return;

                let winElement = $(
                  `.${this.baseClass} .round_${slot.nextWin[0]} .slot_${
                    slot.nextWin[1] + 1
                  }`
                );

                if (winElement && winElement.offset()) {
                  slotLines += `<path class="${
                    this.baseClass
                  } line_r_${roundKey} s_${i + 1}" d="
                  M${[
                    slotElement.offset().left + slotElement.outerWidth(),
                    slotElement.offset().top + slotElement.outerHeight() / 2,
                  ].join(" ")}
                  ${[
                    [
                      slotElement.offset().left +
                        slotElement.outerWidth() +
                        (winElement.offset().left -
                          (slotElement.offset().left +
                            slotElement.outerWidth())) /
                          2,
                      slotElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                    [
                      slotElement.offset().left +
                        slotElement.outerWidth() +
                        (winElement.offset().left -
                          (slotElement.offset().left +
                            slotElement.outerWidth())) /
                          2,
                      winElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                    [
                      winElement.offset().left,
                      winElement.offset().top + winElement.outerHeight() / 2,
                    ],
                  ]
                    .map((point) => point.join(" "))
                    .map((point) => "L" + point)
                    .join(" ")}"
                  stroke="black" fill="none" stroke-width="3" />`;
                }

                // Lines for progressions in
                if (
                  progressionsIn > 0 &&
                  ((parseInt(roundKey) > 0 && parseInt(roundKey) == 1) ||
                    (parseInt(roundKey) < 0 &&
                      Math.abs(parseInt(roundKey)) == 1))
                ) {
                  slotLines += `<path class="${this.baseClass} line_in_r_${
                    Math.sign(parseInt(roundKey)) * Math.abs(parseInt(roundKey))
                  } s_${i + 1}" d="
                  M${[
                    slotElement.offset().left - 50,
                    slotElement.offset().top + slotElement.outerHeight() / 2,
                  ].join(" ")}
                  ${[
                    [
                      slotElement.offset().left,
                      slotElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                  ]
                    .map((point) => point.join(" "))
                    .map((point) => "L" + point)
                    .join(" ")}"
                  stroke="black" fill="none" stroke-width="3" />`;
                }

                // Lines for progressions out
                if (
                  progressionsOut > 0 &&
                  ((parseInt(roundKey) > 0 &&
                    parseInt(roundKey) == Object.keys(winnersRounds).length) ||
                    (parseInt(roundKey) < 0 &&
                      Math.abs(parseInt(roundKey)) ==
                        Object.keys(losersRounds).length))
                ) {
                  slotLines += `<path class="${
                    this.baseClass
                  } line_out_r_${roundKey} s_${i + 1}" d="
                  M${[
                    slotElement.offset().left + slotElement.outerWidth(),
                    slotElement.offset().top + slotElement.outerHeight() / 2,
                  ].join(" ")}
                  ${[
                    [
                      slotElement.offset().left + slotElement.outerWidth() + 45,
                      slotElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                  ]
                    .map((point) => point.join(" "))
                    .map((point) => "L" + point)
                    .join(" ")}
                  M${[
                    slotElement.offset().left + slotElement.outerWidth() + 40,
                    slotElement.offset().top +
                      slotElement.outerHeight() / 2 -
                      5,
                  ].join(" ")}
                  ${[
                    [
                      slotElement.offset().left + slotElement.outerWidth() + 45,
                      slotElement.offset().top + slotElement.outerHeight() / 2,
                    ],
                    [
                      slotElement.offset().left + slotElement.outerWidth() + 40,
                      slotElement.offset().top +
                        slotElement.outerHeight() / 2 +
                        5,
                    ],
                  ]
                    .map((point) => point.join(" "))
                    .map((point) => "L" + point)
                    .join(" ")}"
                  stroke="black" fill="none" stroke-width="3" />`;
                }
              }
            },
            { baseClass: baseClass }
          );
        });

        $(".lines").html(slotLines);

        // ANIMATIONS
        animations = {};

        entryAnim = gsap.timeline();

        Object.entries(bracket).forEach(function ([roundKey, round], r) {
          animations[roundKey] = {};
          Object.values(round.sets).forEach((set, setIndex) => {
            let anim = gsap.timeline();

            anim.addLabel("hidden");

            anim.add(
              AnimateLine($(`.line_in_r_${roundKey}.s_${setIndex + 1}`)),
              0
            );

            anim.from(
              $(`.round_${roundKey} .slot_${setIndex + 1}`),
              { x: -50, autoAlpha: 0, duration: 0.4 },
              0.5
            );

            anim.addLabel("displayed");

            anim.add(
              AnimateLine($(`.line_r_${roundKey}.s_${setIndex + 1}`)),
              0.9
            );
            anim.add(
              AnimateLine($(`.line_out_r_${roundKey}.s_${setIndex + 1}`)),
              1.4
            );

            anim.addLabel("over");

            animations[roundKey][setIndex] = anim;
            anim.pause();

            entryAnim.add(
              AnimateElement(roundKey, setIndex, set),
              Math.abs(parseInt(roundKey)) * 0.6
            );
          });
        });

        entryAnim.play();
      }

      let GfResetRoundNum = Math.max.apply(
        null,
        Object.keys(bracket).map((r) => parseInt(r))
      );

      let gf = bracket[GfResetRoundNum - 1].sets[0];
      let isReset = gf.score[0] < gf.score[1];

      // TRIGGER ANIMATIONS
      if (entryAnim && entryAnim.progress() >= 1) {
        Object.entries(bracket).forEach(function ([roundKey, round], r) {
          Object.values(round.sets).forEach((set, setIndex) => {
            AnimateElement(roundKey, setIndex, set);
          });
        });
      }

      // UPDATE SCORES
      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        if (parseInt(roundKey) < 0) {
          baseClass = "losers_container";
        } else {
          baseClass = "winners_container";
        }

        SetInnerHtml(
          $(`.${baseClass} .round_${parseInt(roundKey)} .round_name`),
          round.name
        );

        Object.values(round.sets).forEach(function (slot, i) {
          Object.values(slot.score).forEach(
            function (score, p) {
              SetInnerHtml(
                $(
                  `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                    i + 1
                  } .slot_p_${p}.container .score`
                ),
                `
                  ${score == -1 ? "DQ" : score}
                `
              );
            },
            { baseClass: baseClass }
          );
          if (slot.score[0] > slot.score[1]) {
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${0}.container`
            ).css("filter", "brightness(1)");
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${1}.container`
            ).css("filter", "brightness(0.6)");
          } else if (slot.score[1] > slot.score[0]) {
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${0}.container`
            ).css("filter", "brightness(0.6)");
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${1}.container`
            ).css("filter", "brightness(1)");
          } else {
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${0}.container`
            ).css("filter", "brightness(1)");
            $(
              `.${this.baseClass} .round_${parseInt(roundKey)} .slot_${
                i + 1
              } .slot_p_${1}.container`
            ).css("filter", "brightness(1)");
          }
        });
      });

      // UPDATE PLAYER DATA
      Object.entries(bracket).forEach(function ([roundKey, round], r) {
        Object.values(round.sets).forEach((set, setIndex) => {
          set.playerId.forEach((pid, index) => {
            let element = $(
              `.round_${roundKey} .slot_${setIndex + 1} .slot_p_${index}`
            ).get(0);

            if (!element) return;

            let player = null;

            if (players[pid]) player = players[pid].player["1"];

            SetInnerHtml(
              $(element).find(`.name`),
              `
                <span>
                  <span class="sponsor">
                    ${player && player.team ? player.team : ""}
                  </span>
                  ${player ? player.name : ""}
                </span>
              `
            );

            SetInnerHtml(
              $(element).find(`.flagcountry`),
              player && player.country.asset
                ? `<div class='flag' style='background-image: url(../../${player.country.asset.toLowerCase()})'></div>`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.flagstate`),
              player && player.state.asset
                ? `<div class='flag' style='background-image: url(../../${player.state.asset})'></div>`
                : ""
            );

            let charactersHtml = "";

            if (player && player.character) {
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
            }
            SetInnerHtml(
              $(element).find(`.character_container`),
              charactersHtml,
              undefined,
              0,
              () => {
                $(element)
                  .find(`.character_container .icon.stockicon div`)
                  .each((e, i) => {
                    if (
                      player &&
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
              $(element).find(`.sponsor_icon`),
              player && player.sponsor_logo
                ? `<div style='background-image: url(../../${player.sponsor_logo})'></div>`
                : "<div></div>"
            );

            SetInnerHtml(
              $(element).find(`.avatar`),
              player && player.avatar
                ? `<div style="background-image: url('../../${player.avatar}')"></div>`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.online_avatar`),
              player && player.online_avatar
                ? `<div style="background-image: url('${player.online_avatar}')"></div>`
                : '<div style="background: gray)"></div>'
            );

            SetInnerHtml(
              $(element).find(`.twitter`),
              player && player.twitter
                ? `<span class="twitter_logo"></span>${String(player.twitter)}`
                : ""
            );

            SetInnerHtml(
              $(element).find(`.sponsor-container`),
              `<div class='sponsor-logo' style='background-image: url(../../${
                player ? player.sponsor_logo : ""
              })'></div>`
            );
          });
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
