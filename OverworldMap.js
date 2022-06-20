class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    )
  }

  isSpaceTaken(currentX, currentY, direction) {
    const {
      x,
      y
    } = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.id = key;

      //TODO: determine if this object should actually mount
      object.mount(this);

    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;

    //Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {
      this.startCutscene(match.talking[0].events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events)
    }
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x, y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {
      x,
      y
    } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }

}

window.OverworldMaps = {
    BackLotHallway: {
      lowerSrc: "/images/maps/BackLotHallwayLower.png",
      upperSrc: "/images/maps/BackLotHallwayUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(4),
          y: utils.withGrid(3),
        }),
        postman: new Person({
          x: utils.withGrid(1),
          y: utils.withGrid(6),
          src: "/images/characters/people/postman.png",
          behaviorLoop: [{
            who: "postman",
            type: "stand",
            direction: "left"
          }, ],
          talking: [{
            events: [{
                type: "textMessage",
                text: "I'm busy kid.",
                faceHero: "postman"
              },
              // {
              //   type: "textMessage",
              //   text: "Mail doesn't deliver itself!",
              //   faceHero: "postman"
              // },
            ]
          }]
        }),
        mailTruck: new Person({
          x: utils.withGrid(3),
          y: utils.withGrid(2),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
              type: "textMessage",
              text: "The mailman's truck. Must be picking up the packages from yesterday."
            }]
          }],
        }),
        mailboxA: new Person({
          x: utils.withGrid(0),
          y: utils.withGrid(5),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
              type: "textMessage",
              text: "I don't think I should open that..."
            }]
          }],
        }),
        mailboxB: new Person({
          x: utils.withGrid(0),
          y: utils.withGrid(6),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
              type: "textMessage",
              text: "I don't think I should open that..."
            }]
          }],
        }),
        poster: new Person({
          x: utils.withGrid(6),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
                type: "textMessage",
                text: "Please make sure door is shut behind you. Thanks!"
              },
              {
                type: "textMessage",
                text: " -- Maintenance"
              },
              {
                who: "hero",
                type: "walk",
                direction: "down"
              },
            ]
          }],
        }),
      },
      walls: {
        //Left-Side of Map
        [utils.asGridCoord(0, 4)]: true, //mailbox
        [utils.asGridCoord(0, 5)]: true, //mailbox
        [utils.asGridCoord(0, 6)]: true, //mailbox
        [utils.asGridCoord(-1, 7)]: true,
        [utils.asGridCoord(-1, 8)]: true,
        [utils.asGridCoord(-1, 9)]: true,
        [utils.asGridCoord(-1, 10)]: true,
        [utils.asGridCoord(-1, 11)]: true,
        [utils.asGridCoord(-1, 12)]: true,
        [utils.asGridCoord(-1, 13)]: true,
        [utils.asGridCoord(-1, 14)]: true,
        // //Top of Map
        [utils.asGridCoord(0, 3)]: true,
        [utils.asGridCoord(1, 3)]: true, //open door
        [utils.asGridCoord(2, 3)]: true, //open door
        [utils.asGridCoord(3, 2)]: true, //outside
        [utils.asGridCoord(4, 2)]: true, //outside
        [utils.asGridCoord(4, 4)]: true, //closed door
        [utils.asGridCoord(5, 3)]: true, //closed door
        [utils.asGridCoord(6, 3)]: true,
        [utils.asGridCoord(7, 3)]: true,
        // //Right-Side of Map
        [utils.asGridCoord(8, 4)]: true,
        [utils.asGridCoord(8, 5)]: true,
        [utils.asGridCoord(8, 6)]: true,
        [utils.asGridCoord(8, 7)]: true,
        [utils.asGridCoord(8, 8)]: true,
        [utils.asGridCoord(8, 9)]: true,
        [utils.asGridCoord(8, 10)]: true,
        [utils.asGridCoord(8, 11)]: true,
        [utils.asGridCoord(8, 12)]: true,
        [utils.asGridCoord(8, 13)]: true,
        [utils.asGridCoord(8, 14)]: true,
        // //Bottom of Map
        [utils.asGridCoord(0, 14)]: true,
        [utils.asGridCoord(1, 14)]: true,
        [utils.asGridCoord(1, 14)]: true,
        [utils.asGridCoord(1, 15)]: true,
        [utils.asGridCoord(6, 14)]: true,
        [utils.asGridCoord(7, 14)]: true,
        [utils.asGridCoord(6, 14)]: true,
        [utils.asGridCoord(6, 15)]: true,
      },
      cutsceneSpaces: {
        [utils.asGridCoord(3, 9)]: [{
          events: [{
              who: "postman",
              type: "walk",
              direction: "right"
            },
            {
              who: "postman",
              type: "walk",
              direction: "right"
            },
            {
              who: "postman",
              type: "walk",
              direction: "up"
            },
            {
              who: "postman",
              type: "walk",
              direction: "up"
            },
            {
              who: "postman",
              type: "walk",
              direction: "up"
            },
            {
              who: "postman",
              type: "stand",
              direction: "up",
              time: 1600
            },
            {
              who: "postman",
              type: "walk",
              direction: "right"
            },
          ]
        }],
        [utils.asGridCoord(2, 15)]: [{
          events: [{
            type: "changeMap",
            map: "HallwayCredits"
          }]
        }],
        [utils.asGridCoord(3, 15)]: [{
          events: [{
            type: "changeMap",
            map: "HallwayCredits"
          }]
        }],
        [utils.asGridCoord(4, 15)]: [{
          events: [{
            type: "changeMap",
            map: "HallwayCredits"
          }]
        }],
        [utils.asGridCoord(5, 15)]: [{
          events: [{
            type: "changeMap",
            map: "HallwayCredits"
          }]
        }],
      },
    },
    HallwayCredits: {
      lowerSrc: "/images/maps/HallwayCreditsLower.png",
      upperSrc: "/images/maps/HallwayCreditsUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(7),
          y: utils.withGrid(7),
        }),
        DoorA: new Person({
          x: utils.withGrid(7),
          y: utils.withGrid(6),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
              type: "textMessage",
              text: "Maybe I should check in at the front desk first..."
            }, ]
          }]
        }),
        DoorB: new Person({
          x: utils.withGrid(8),
          y: utils.withGrid(6),
          src: "/images/characters/people/object.png",
          talking: [{
            events: [{
              type: "textMessage",
              text: "Maybe I should check in at the front desk first..."
            }, ]
          }]
        }),
      },
      walls: {
        //Left-Side of Map
        [utils.asGridCoord(5, 7)]: true,
        [utils.asGridCoord(5, 8)]: true,
        [utils.asGridCoord(5, 9)]: true,
        [utils.asGridCoord(5, 10)]: true,
        //Top of Map
        [utils.asGridCoord(6, 6)]: true,
        [utils.asGridCoord(7, 6)]: true,
        [utils.asGridCoord(8, 6)]: true,
        [utils.asGridCoord(9, 6)]: true,
        [utils.asGridCoord(10, 9)]: true,
        [utils.asGridCoord(11, 9)]: true,
        [utils.asGridCoord(12, 9)]: true,
        [utils.asGridCoord(13, 9)]: true,
        [utils.asGridCoord(14, 9)]: true,
        [utils.asGridCoord(15, 9)]: true,
        [utils.asGridCoord(16, 9)]: true,
        [utils.asGridCoord(17, 9)]: true,
        [utils.asGridCoord(18, 9)]: true,
        [utils.asGridCoord(19, 9)]: true,
        [utils.asGridCoord(20, 9)]: true,
        [utils.asGridCoord(21, 9)]: true,
        [utils.asGridCoord(22, 9)]: true,
        [utils.asGridCoord(23, 9)]: true,
        [utils.asGridCoord(24, 9)]: true,
        [utils.asGridCoord(25, 9)]: true,
        [utils.asGridCoord(26, 9)]: true,
        [utils.asGridCoord(27, 9)]: true,
        [utils.asGridCoord(28, 9)]: true,
        [utils.asGridCoord(29, 9)]: true,
        [utils.asGridCoord(30, 9)]: true,
        [utils.asGridCoord(31, 9)]: true,
        [utils.asGridCoord(32, 9)]: true,
        [utils.asGridCoord(33, 9)]: true,
        [utils.asGridCoord(34, 9)]: true,
        [utils.asGridCoord(35, 9)]: true,
        [utils.asGridCoord(36, 9)]: true,
        [utils.asGridCoord(37, 9)]: true,
        [utils.asGridCoord(38, 9)]: true,
        [utils.asGridCoord(39, 9)]: true,
        [utils.asGridCoord(40, 9)]: true,
        [utils.asGridCoord(41, 9)]: true,
        [utils.asGridCoord(42, 9)]: true,
        [utils.asGridCoord(43, 9)]: true,
        [utils.asGridCoord(44, 9)]: true,
        [utils.asGridCoord(45, 9)]: true,
        [utils.asGridCoord(46, 9)]: true,
        [utils.asGridCoord(47, 9)]: true,
        [utils.asGridCoord(48, 9)]: true,
        [utils.asGridCoord(49, 9)]: true,
        [utils.asGridCoord(50, 9)]: true,
        [utils.asGridCoord(51, 9)]: true,
        [utils.asGridCoord(52, 9)]: true,
        [utils.asGridCoord(53, 9)]: true,
        [utils.asGridCoord(54, 9)]: true,
        [utils.asGridCoord(55, 9)]: true,
        [utils.asGridCoord(56, 9)]: true,
        [utils.asGridCoord(57, 9)]: true,
        [utils.asGridCoord(58, 9)]: true,
        [utils.asGridCoord(59, 9)]: true,
        [utils.asGridCoord(60, 9)]: true,
        [utils.asGridCoord(61, 9)]: true,
        [utils.asGridCoord(62, 9)]: true,
        [utils.asGridCoord(63, 9)]: true,
        [utils.asGridCoord(64, 9)]: true,
        [utils.asGridCoord(65, 9)]: true,
        [utils.asGridCoord(66, 9)]: true,
        [utils.asGridCoord(67, 9)]: true,
        [utils.asGridCoord(68, 9)]: true,
        [utils.asGridCoord(69, 9)]: true,
        [utils.asGridCoord(70, 9)]: true,
        [utils.asGridCoord(71, 9)]: true,
        [utils.asGridCoord(72, 9)]: true,
        [utils.asGridCoord(73, 9)]: true,
        [utils.asGridCoord(74, 9)]: true,
        [utils.asGridCoord(75, 9)]: true,

        //Right-Side of Map
        [utils.asGridCoord(10, 0)]: true,
        [utils.asGridCoord(10, 1)]: true,
        [utils.asGridCoord(10, 2)]: true,
        [utils.asGridCoord(10, 3)]: true,
        [utils.asGridCoord(10, 4)]: true,
        [utils.asGridCoord(10, 5)]: true,
        [utils.asGridCoord(10, 6)]: true,
        [utils.asGridCoord(10, 7)]: true,
        [utils.asGridCoord(10, 8)]: true,
        [utils.asGridCoord(10, 9)]: true,
        //Bottom of Map
        [utils.asGridCoord(6, 11)]: true,
        [utils.asGridCoord(7, 11)]: true,
        [utils.asGridCoord(8, 11)]: true,
        [utils.asGridCoord(9, 11)]: true,
        [utils.asGridCoord(10, 11)]: true,
        [utils.asGridCoord(11, 11)]: true,
        [utils.asGridCoord(12, 11)]: true,
        [utils.asGridCoord(13, 11)]: true,
        [utils.asGridCoord(14, 11)]: true,
        [utils.asGridCoord(15, 11)]: true,
        [utils.asGridCoord(16, 11)]: true,
        [utils.asGridCoord(17, 11)]: true,
        [utils.asGridCoord(18, 11)]: true,
        [utils.asGridCoord(19, 11)]: true,
        [utils.asGridCoord(20, 11)]: true,
        [utils.asGridCoord(21, 11)]: true,
        [utils.asGridCoord(22, 11)]: true,
        [utils.asGridCoord(23, 11)]: true,
        [utils.asGridCoord(24, 11)]: true,
        [utils.asGridCoord(25, 11)]: true,
        [utils.asGridCoord(26, 11)]: true,
        [utils.asGridCoord(27, 11)]: true,
        [utils.asGridCoord(28, 11)]: true,
        [utils.asGridCoord(29, 11)]: true,
        [utils.asGridCoord(30, 11)]: true,
        [utils.asGridCoord(31, 11)]: true,
        [utils.asGridCoord(32, 11)]: true,
        [utils.asGridCoord(33, 11)]: true,
        [utils.asGridCoord(34, 11)]: true,
        [utils.asGridCoord(35, 11)]: true,
        [utils.asGridCoord(36, 11)]: true,
        [utils.asGridCoord(37, 11)]: true,
        [utils.asGridCoord(38, 11)]: true,
        [utils.asGridCoord(39, 11)]: true,
        [utils.asGridCoord(40, 11)]: true,
        [utils.asGridCoord(41, 11)]: true,
        [utils.asGridCoord(42, 11)]: true,
        [utils.asGridCoord(43, 11)]: true,
        [utils.asGridCoord(44, 11)]: true,
        [utils.asGridCoord(45, 11)]: true,
        [utils.asGridCoord(46, 11)]: true,
        [utils.asGridCoord(47, 11)]: true,
        [utils.asGridCoord(48, 11)]: true,
        [utils.asGridCoord(49, 11)]: true,
        [utils.asGridCoord(50, 11)]: true,
        [utils.asGridCoord(51, 11)]: true,
        [utils.asGridCoord(52, 11)]: true,
        [utils.asGridCoord(53, 11)]: true,
        [utils.asGridCoord(54, 11)]: true,
        [utils.asGridCoord(55, 11)]: true,
        [utils.asGridCoord(56, 11)]: true,
        [utils.asGridCoord(57, 11)]: true,
        [utils.asGridCoord(58, 11)]: true,
        [utils.asGridCoord(59, 11)]: true,
        [utils.asGridCoord(60, 11)]: true,
        [utils.asGridCoord(61, 11)]: true,
        [utils.asGridCoord(62, 11)]: true,
        [utils.asGridCoord(63, 11)]: true,
        [utils.asGridCoord(64, 11)]: true,
        [utils.asGridCoord(65, 11)]: true,
        [utils.asGridCoord(66, 11)]: true,
        [utils.asGridCoord(67, 11)]: true,
        [utils.asGridCoord(68, 11)]: true,
        [utils.asGridCoord(69, 11)]: true,
        [utils.asGridCoord(70, 11)]: true,
        [utils.asGridCoord(71, 11)]: true,
        [utils.asGridCoord(72, 11)]: true,
        [utils.asGridCoord(73, 11)]: true,
        [utils.asGridCoord(74, 11)]: true,
        [utils.asGridCoord(75, 11)]: true,
      },
      cutsceneSpaces: {
        [utils.asGridCoord(75, 10)]: [{
          events: [{
            type: "changeMap",
            map: "Lobby"
          }]
        }],
      }
    },
    Lobby: {
      lowerSrc: "/images/maps/LobbyLower.png",
      upperSrc: "/images/maps/LobbyUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(2),
          y: utils.withGrid(6),
        }),
        guard: new Person({
          x: utils.withGrid(8),
          y: utils.withGrid(2),
          src: "/images/characters/people/SecurityGuard.png",
        }),
        checkInL1: new Person({
          x: utils.withGrid(6),
          y: utils.withGrid(2),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInL2: new Person({
          x: utils.withGrid(6),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInT1: new Person({
          x: utils.withGrid(7),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInT2: new Person({
          x: utils.withGrid(8),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInT3: new Person({
          x: utils.withGrid(9),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInR1: new Person({
          x: utils.withGrid(10),
          y: utils.withGrid(2),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
        checkInR2: new Person({
          x: utils.withGrid(10),
          y: utils.withGrid(3),
          src: "/images/characters/people/object.png",
          talking: [{
              events: [{
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                }]
            }]
        }),
      },
      walls: {

        //doorway
        [utils.asGridCoord(2, 5)]: true,  //top of doorway
        [utils.asGridCoord(3, 5)]: true,  //top of doorway
        [utils.asGridCoord(1, 6)]: true,  //left of doorway
        [utils.asGridCoord(1, 7)]: true,  //left of doorway
        [utils.asGridCoord(2, 8)]: true,  //bottom of doorway
        [utils.asGridCoord(3, 8)]: true,  //bottom doorway

        //desk
        [utils.asGridCoord(6,2)]: true, //left side of desk
        [utils.asGridCoord(6,3)]: true, //left side of desk
        [utils.asGridCoord(7,3)]: true, //front side of desk
        [utils.asGridCoord(8,3)]: true, //front side of desk
        [utils.asGridCoord(9,3)]: true, //front side of desk
        [utils.asGridCoord(10,2)]: true, //right side of desk
        [utils.asGridCoord(10,3)]: true, //right side of desk

        //elevatorA
        [utils.asGridCoord(2,16)]: true,  //elevatorA top wall (right)
        [utils.asGridCoord(1,16)]: true,  //elevatorA top wall (right)
        [utils.asGridCoord(0,16)]: true,  //elevatorA top wall (right)
        [utils.asGridCoord(3,16)]: true,  //elevatorA front wall
        [utils.asGridCoord(3,17)]: true,  //elevatorA front wall (above door)
        [utils.asGridCoord(3,19)]: true,  //elevatorA front wall (below door)
        [utils.asGridCoord(3,20)]: true,  //elevatorA front wall
        [utils.asGridCoord(-1,17)]: true, //elevatorA back wall
        [utils.asGridCoord(-1,18)]: true, //elevatorA back wall
        [utils.asGridCoord(-1,19)]: true, //elevatorA back wall
        [utils.asGridCoord(2,20)]: true,  //elevatorA bottom wall (left)
        [utils.asGridCoord(1,20)]: true,  //elevatorA bottom wall (left)
        [utils.asGridCoord(0,20)]: true,  //elevatorA bottom wall (left)

        //elevatorB
        [utils.asGridCoord(2,21)]: true,  //elevatorB top wall (right)
        [utils.asGridCoord(1,21)]: true,  //elevatorB top wall (right)
        [utils.asGridCoord(0,21)]: true,  //elevatorB top wall (right)
        [utils.asGridCoord(3,21)]: true,  //elevatorB front wall
        [utils.asGridCoord(3,22)]: true,  //elevatorB front wall (above door)
        [utils.asGridCoord(3,24)]: true,  //elevatorB front wall (below door)
        [utils.asGridCoord(3,25)]: true,  //elevatorB front wall
        [utils.asGridCoord(-1,22)]: true, //elevatorB back wall
        [utils.asGridCoord(-1,23)]: true, //elevatorB back wall
        [utils.asGridCoord(-1,24)]: true, //elevatorB back wall
        [utils.asGridCoord(2,25)]: true,  //elevatorB bottom wall (left)
        [utils.asGridCoord(1,25)]: true,  //elevatorB bottom wall (left)
        [utils.asGridCoord(0,25)]: true,  //elevatorB bottom wall (left)

        //elevatorC
        [utils.asGridCoord(13,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(14,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(15,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(13,16)]: true,  //elevatorC front wall
        [utils.asGridCoord(13,17)]: true,  //elevatorC front wall (above door)
        [utils.asGridCoord(13,19)]: true,  //elevatorC front wall (below door)
        [utils.asGridCoord(13,20)]: true,  //elevatorC front wall
        [utils.asGridCoord(17,17)]: true,  //elevatorC back wall
        [utils.asGridCoord(17,18)]: true,  //elevatorC back wall
        [utils.asGridCoord(17,19)]: true,  //elevatorC back wall
        [utils.asGridCoord(14,20)]: true,  //elevatorC bottom wall (left)
        [utils.asGridCoord(15,20)]: true,  //elevatorC bottom wall (left)
        [utils.asGridCoord(16,20)]: true,  //elevatorC bottom wall (left)

        //elevatorD
        [utils.asGridCoord(14,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(15,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(16,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(13,21)]: true,  //elevatorD front wall
        [utils.asGridCoord(13,22)]: true,  //elevatorD front wall (above door)
        [utils.asGridCoord(13,24)]: true,  //elevatorD front wall (below door)
        [utils.asGridCoord(13,25)]: true,  //elevatorD front wall
        [utils.asGridCoord(17,22)]: true,  //elevatorD back wall
        [utils.asGridCoord(17,23)]: true,  //elevatorD back wall
        [utils.asGridCoord(17,24)]: true,  //elevatorD back wall
        [utils.asGridCoord(14,25)]: true,  //elevatorD bottom wall (left)
        [utils.asGridCoord(15,25)]: true,  //elevatorD bottom wall (left)
        [utils.asGridCoord(16,25)]: true,  //elevatorD bottom wall (left)

        //Top of Map
        [utils.asGridCoord(4, 1)]: true,   //wall
        [utils.asGridCoord(5, 1)]: true,   //wall
        [utils.asGridCoord(6, 1)]: true,   //wall
        [utils.asGridCoord(7, 1)]: true,   //wall
        [utils.asGridCoord(8, 1)]: true,   //wall
        [utils.asGridCoord(9, 1)]: true,   //wall
        [utils.asGridCoord(10, 1)]: true,  //wall
        [utils.asGridCoord(11, 1)]: true,  //wall
        [utils.asGridCoord(12, 1)]: true,  //wall

        //Left Side of map
        [utils.asGridCoord(3,2)]: true,   //wall
        [utils.asGridCoord(3,3)]: true,   //wall
        [utils.asGridCoord(3,4)]: true,   //wall
        [utils.asGridCoord(3,8)]: true,   //wall
        [utils.asGridCoord(3,9)]: true,   //wall
        [utils.asGridCoord(3,10)]: true,  //wall
        [utils.asGridCoord(3,11)]: true,  //wall
        [utils.asGridCoord(3,12)]: true,  //wall
        [utils.asGridCoord(3,13)]: true,  //wall
        [utils.asGridCoord(3,14)]: true,  //wall
        [utils.asGridCoord(3,15)]: true,  //wall
        [utils.asGridCoord(-1,26)]: true, //wall (below elevator)

        //Bottom of map
        [utils.asGridCoord(0,27)]: true,  //wall
        [utils.asGridCoord(1,27)]: true,  //wall
        [utils.asGridCoord(2,27)]: true,  //wall
        [utils.asGridCoord(3,27)]: true,  //wall
        [utils.asGridCoord(4,27)]: true,  //wall
        [utils.asGridCoord(5,27)]: true,  //wall
        [utils.asGridCoord(6,27)]: true,  //wall
        [utils.asGridCoord(7,27)]: true,  //wall
        [utils.asGridCoord(8,27)]: true,  //wall
        [utils.asGridCoord(9,27)]: true,  //wall
        [utils.asGridCoord(10,27)]: true,  //wall
        [utils.asGridCoord(11,27)]: true,  //wall
        [utils.asGridCoord(12,27)]: true,  //wall
        [utils.asGridCoord(13,27)]: true,  //wall
        [utils.asGridCoord(14,27)]: true,  //wall
        [utils.asGridCoord(15,27)]: true,  //wall
        [utils.asGridCoord(16,27)]: true,  //wall

        //Right Side of Map
        [utils.asGridCoord(13, 2)]: true,  //wall
        [utils.asGridCoord(13, 3)]: true,  //wall
        [utils.asGridCoord(13, 4)]: true,  //wall
        [utils.asGridCoord(13, 5)]: true,  //wall
        [utils.asGridCoord(13, 6)]: true,  //wall
        [utils.asGridCoord(13, 7)]: true,  //wall
        [utils.asGridCoord(13, 8)]: true,  //wall
        [utils.asGridCoord(13, 9)]: true,  //wall
        [utils.asGridCoord(13, 10)]: true, //wall
        [utils.asGridCoord(13, 11)]: true, //wall
        [utils.asGridCoord(13, 12)]: true, //wall
        [utils.asGridCoord(13, 13)]: true, //wall
        [utils.asGridCoord(13, 14)]: true, //wall
        [utils.asGridCoord(13, 15)]: true, //wall
        [utils.asGridCoord(17, 26)]: true, //wall
      },
    }
  }
