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
    this.isPaused = false;
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
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
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

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
        break;
      }
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

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf]
        })
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene( match[0].events )
    }
  }

  addWall(x,y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x,y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {x,y} = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x,y);
  }

}

window.OverworldMaps = {
    BackLotHallway: {
      lowerSrc: "images/maps/BackLotHallwayLower.png",
      upperSrc: "images/maps/BackLotHallwayUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(4),
          y: utils.withGrid(3),
        }),
        toshi: new Person({
          x: utils.withGrid(6),
          y: utils.withGrid(4),
          src: "images/characters/people/toshi.png",
          behaviorLoop: [
            { type: "stand",  direction: "down" },
          ],
          talking: [
            {
              required: ["TALKED_TO_POSTMAN"],
              events: [
                { type: "textMessage", text: "Isn't Postman the coolest?", faceHero: "toshi" },
              ]
            },
            {
              events: [
                { type: "textMessage", text: "Have you talked to postman yet?", faceHero: "toshi" },
              ]
            },
          ]
        }),
        postman: new Person({
          x: utils.withGrid(1),
          y: utils.withGrid(6),
          src: "images/characters/people/postman.png",
          behaviorLoop: [
            { type: "stand",  direction: "left" },
          ],
          talking: [
            {
              events: [
                { type: "textMessage", text: "I'm a little busy kid...", faceHero: "postman" },
                { type: "textMessage", text: "mail doesn't deliver itself!", faceHero: "postman" },
                { type: "addStoryFlag", flag: "TALKED_TO_POSTMAN"},
                { who: "toshi", type: "walk", direction: "down" },
                { who: "toshi", type: "walk", direction: "down" },
                { who: "toshi", type: "walk", direction: "down" },
                { who: "toshi", type: "stand", direction: "down" },
              ]
            }
          ]
        }),
        mailTruck: new Person({
          x: utils.withGrid(3),
          y: utils.withGrid(2),
          src: "images/characters/object.png",
          talking: [
            {
              required: ["TALKED_TO_POSTMAN"],
              events: [
                { type: "textMessage", text: "hey kid, get away from my truck!", faceHero: "postman" },
                { who: "hero", type: "walk", direction: "down" },
                { who: "hero", type: "walk", direction: "down" },
              ]
            },
            {
              events: [
                { type: "textMessage", text: "It's the mail truck! I don't think I should be touching it..." },
              ]
            },
          ],
          
        }),
        mailboxA: new Person({
          x: utils.withGrid(0),
          y: utils.withGrid(5),
          src: "images/characters/object.png",
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
          src: "images/characters/object.png",
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
          src: "images/characters/object.png",
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
      lowerSrc: "images/maps/HallwayCreditsLower.png",
      upperSrc: "images/maps/HallwayCreditsUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(7),
          y: utils.withGrid(7),
        }),
        DoorA: new Person({
          x: utils.withGrid(7),
          y: utils.withGrid(6),
          src: "images/characters/object.png",
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
          src: "images/characters/object.png",
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
      lowerSrc: "images/maps/LobbyLower.png",
      upperSrc: "images/maps/LobbyUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(2),
          y: utils.withGrid(6),
        }),
        guard: new Person({
          x: utils.withGrid(8),
          y: utils.withGrid(2),
          src: "images/characters/people/SecurityGuard.png",
        }),
        checkIn: new Person({
          x: utils.withGrid(8),
          y: utils.withGrid(3),
          src: "images/characters/object.png",
          talking: [
            {
              required: ["SIGN_IN"],
              events: [
                { type: "textMessage", text: "Thanks for signing in!" },
              ]
            },
            {
              events: [
                {
                  type: "textMessage",
                  text: "Please sign in before heading up the elevator.",
                },
                { type: "addStoryFlag", flag: "SIGN_IN"},
              ]
            },
          ]
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
        [utils.asGridCoord(17,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(18,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(19,16)]: true,  //elevatorC top wall (right)
        [utils.asGridCoord(17,16)]: true,  //elevatorC front wall
        [utils.asGridCoord(17,17)]: true,  //elevatorC front wall (above door)
        [utils.asGridCoord(17,19)]: true,  //elevatorC front wall (below door)
        [utils.asGridCoord(17,20)]: true,  //elevatorC front wall
        [utils.asGridCoord(20,16)]: true,  //elevatorC back wall 
        [utils.asGridCoord(21,17)]: true,  //elevatorC back wall
        [utils.asGridCoord(21,18)]: true,  //elevatorC back wall
        [utils.asGridCoord(21,19)]: true,  //elevatorC back wall
        [utils.asGridCoord(18,20)]: true,  //elevatorC bottom wall (left)
        [utils.asGridCoord(19,20)]: true,  //elevatorC bottom wall (left)
        [utils.asGridCoord(20,20)]: true,  //elevatorC bottom wall (left)

        //elevatorD
        [utils.asGridCoord(18,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(19,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(20,21)]: true,  //elevatorD top wall (right)
        [utils.asGridCoord(17,21)]: true,  //elevatorD front wall
        [utils.asGridCoord(17,22)]: true,  //elevatorD front wall (above door)
        [utils.asGridCoord(17,24)]: true,  //elevatorD front wall (below door)
        [utils.asGridCoord(17,25)]: true,  //elevatorD front wall
        [utils.asGridCoord(21,22)]: true,  //elevatorD back wall
        [utils.asGridCoord(21,23)]: true,  //elevatorD back wall
        [utils.asGridCoord(21,24)]: true,  //elevatorD back wall
        [utils.asGridCoord(18,25)]: true,  //elevatorD bottom wall (left)
        [utils.asGridCoord(19,25)]: true,  //elevatorD bottom wall (left)
        [utils.asGridCoord(20,25)]: true,  //elevatorD bottom wall (left)

        //ATM machine
        [utils.asGridCoord(19, 8)]: true,   //wall left of ATM 
        [utils.asGridCoord(20, 8)]: true,   //ATM
        [utils.asGridCoord(21, 8)]: true,   //ATM 
        [utils.asGridCoord(22, 8)]: true,   //wall right of ATM
        [utils.asGridCoord(17, 12)]: true,  //wall below ATM
        [utils.asGridCoord(18, 12)]: true,  //wall below ATM
        [utils.asGridCoord(19, 12)]: true,  //wall below ATM

        [utils.asGridCoord(20, 12)]: true,  //wall left of staircase
        [utils.asGridCoord(23, 8)]: true,   //wall right of staircase
        [utils.asGridCoord(23, 9)]: true,   //wall right of staircase      
        [utils.asGridCoord(23, 10)]: true,  //wall right of staircase
        [utils.asGridCoord(23, 11)]: true,  //wall right of staircase     
        [utils.asGridCoord(23, 12)]: true,  //wall right of staircase
        [utils.asGridCoord(21, 13)]: true,  //bottom of staircase
        [utils.asGridCoord(22, 13)]: true,  //bottom of staircase

        //WestEast Wall Right of Staircase
        [utils.asGridCoord(24, 10)]: true,   //wall right of staircase
        [utils.asGridCoord(25, 10)]: true,   //wall right of staircase
        [utils.asGridCoord(26, 10)]: true,   //wall right of staircase
        [utils.asGridCoord(27, 10)]: true,   //wall right of staircase
        [utils.asGridCoord(28, 10)]: true,   //wall right of staircase

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
        [utils.asGridCoord(13, 1)]: true,  //wall
        [utils.asGridCoord(14, 1)]: true,  //wall
        [utils.asGridCoord(15, 1)]: true,  //wall
        [utils.asGridCoord(16, 1)]: true,  //wall
        [utils.asGridCoord(17, 1)]: true,  //wall
        [utils.asGridCoord(18, 1)]: true,  //wall
        [utils.asGridCoord(19, 1)]: true,  //wall
        [utils.asGridCoord(20, 1)]: true,  //wall
        [utils.asGridCoord(21, 1)]: true,  //wall
        [utils.asGridCoord(22, 1)]: true,  //wall
        [utils.asGridCoord(23, 1)]: true,  //wall
        [utils.asGridCoord(24, 1)]: true,  //wall
        [utils.asGridCoord(25, 1)]: true,  //wall
        [utils.asGridCoord(26, 1)]: true,  //wall
        [utils.asGridCoord(27, 1)]: true,  //wall
        [utils.asGridCoord(28, 1)]: true,  //wall

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
        [utils.asGridCoord(0,27)]: true,   //wall
        [utils.asGridCoord(1,27)]: true,   //wall
        [utils.asGridCoord(2,27)]: true,   //wall
        [utils.asGridCoord(3,27)]: true,   //wall
        [utils.asGridCoord(4,27)]: true,   //wall
        [utils.asGridCoord(5,27)]: true,   //wall
        [utils.asGridCoord(6,27)]: true,   //wall
        [utils.asGridCoord(7,27)]: true,   //wall
        [utils.asGridCoord(8,27)]: true,   //wall
        [utils.asGridCoord(9,27)]: true,   //wall
        [utils.asGridCoord(10,27)]: true,  //wall
        [utils.asGridCoord(11,27)]: true,  //wall
        [utils.asGridCoord(12,27)]: true,  //wall
        [utils.asGridCoord(13,27)]: true,  //wall
        [utils.asGridCoord(14,27)]: true,  //wall
        [utils.asGridCoord(15,27)]: true,  //wall
        [utils.asGridCoord(16,27)]: true,  //wall

        //Right Side of Map
        [utils.asGridCoord(17, 12)]: true, //wall
        [utils.asGridCoord(17, 13)]: true, //wall
        [utils.asGridCoord(17, 14)]: true, //wall
        [utils.asGridCoord(17, 15)]: true, //wall
        [utils.asGridCoord(17, 26)]: true, //wall
        [utils.asGridCoord(29, 2)]: true,  //cafeteria
        [utils.asGridCoord(29, 3)]: true,  //cafeteria
        [utils.asGridCoord(29, 4)]: true,  //cafeteria
        [utils.asGridCoord(29, 5)]: true,  //cafeteria
        [utils.asGridCoord(29, 6)]: true,  //cafeteria
        [utils.asGridCoord(29, 7)]: true,  //cafeteria
        [utils.asGridCoord(29, 8)]: true,  //cafeteria
        [utils.asGridCoord(29, 9)]: true,  //cafeteria
      },
      cutsceneSpaces: {
        [utils.asGridCoord(3, 18)]: [
          {
            events: [
              { type: "changeMap", map: "Elevator" },
              { who: "hero", type: "stand", direction: "up" },
            ]
          }
        ],
        [utils.asGridCoord(17, 18)]: [
          {
            events: [
              { type: "changeMap", map: "Elevator" },
              { who: "hero", type: "stand", direction: "up" },
            ]
          }
        ],
        [utils.asGridCoord(3, 23)]: [
          {
            events: [
              { type: "changeMap", map: "Elevator" },
              { who: "hero", type: "stand", direction: "up" },
            ]
          }
        ],
        [utils.asGridCoord(17, 23)]: [
          {
            events: [
              { type: "changeMap", map: "Elevator" },
              { who: "hero", type: "stand", direction: "up" },
            ]
          }
        ],
      },
    },
    Elevator: {
      lowerSrc: "images/maps/ElevatorLower.png",
      upperSrc: "images/maps/ElevatorUpper.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(12),
          y: utils.withGrid(17),
        }),
        kenny: new Person({
          x: utils.withGrid(10),
          y: utils.withGrid(11),
          src: "images/characters/people/kenny.png",
        }),
      },
      cutsceneSpaces: {
        [utils.asGridCoord(12, 16)]: [{
          events: [
            { who: "hero", type: "walk", direction: "up" },
            { who: "hero", type: "walk", direction: "up" },
            { who: "hero", type: "walk", direction: "up" },
            { who: "hero", type: "walk", direction: "up" },
            { who: "hero", type: "walk", direction: "up" },
            { who: "hero", type: "walk", direction: "right" },
            { who: "hero", type: "stand", direction: "down", time: 1200 },

            { type: "textMessage", text: "Brett?" },
            { who: "kenny", type: "stand", direction: "right" },
            { type: "textMessage", text: "... ... ... ..." },
            { type: "textMessage", text: "... ... ... ..." },
            { type: "textMessage", text: "... ... ... ..." },
            { who: "hero", type: "stand", direction: "left" },
            { type: "textMessage", text: "BRETT: Oh hey Kenny!" },
            { type: "textMessage", text: "BRETT: Heard anything about the new guy?" },
            { type: "textMessage", text: "BRETT: Bridget said he's some tech genius from a far away land..." },
            { type: "textMessage", text: "BRETT: You think he's foreign?" },
            { type: "textMessage", text: "KENNY: I don't know but we need some color in this group." }, 
            { type: "textMessage", text: "BRETT: We have color...we have Darius!" },
            { type: "textMessage", text: "KENNY: He doesn't count..." },
            { type: "textMessage", text: "BRETT: Why not?" },
            { type: "textMessage", text: "KENNY: He's whiter than you!" },
            { type: "textMessage", text: "KENNY: He says AXE not ASK..." },
            { type: "textMessage", text: "KENNY: He drives...a PRIUS..." },
            { type: "textMessage", text: "KENNY: And he HATES fried chicken!" },
            { type: "textMessage", text: "BRETT: That's impossible! That stuff is D----E---LICIOUS" },
            { who: "hero", type: "stand", direction: "down" },
            { type: "textMessage", text: "KENNY: That's what I'm saying!" },
            { who: "kenny", type: "stand", direction: "down", time: "1600" },
            { type: "textMessage", text: "DING!"},
            { type: "textMessage", text: "KENNY: Come  on, let's go see if's here yet." },
            { type: "textMessage", text: "BRETT: Okay!" },

            { who: "kenny", type: "walk", direction: "right" },
            { who: "kenny", type: "walk", direction: "right" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },
            { who: "kenny", type: "walk", direction: "down" },

            { who: "hero", type: "walk", direction: "left" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "down" },
            { type: "changeMap", map: "SeventhFloor"},
          ]
        }],
    }
  },
  SeventhFloor: {
    lowerSrc: "images/maps/SeventhFloorLower.png",
    upperSrc: "images/maps/SeventhFloorUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(3),
        y: utils.withGrid(2),
      }),
      kenny: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(7),
        src: "images/characters/people/kenny.png",
      }),
      toshi: new Person({
        x: utils.withGrid(53),
        y: utils.withGrid(18),
        src: "images/characters/people/toshi.png",
      }),
      bridget: new Person({
        x: utils.withGrid(54),
        y: utils.withGrid(16),
        src: "images/characters/people/bridget.png",
      }),
    },
    walls: {
        //Top Wall
        [utils.asGridCoord(0, 1)]: true,  //Top wall
        [utils.asGridCoord(1, 1)]: true,  //Top wall
        [utils.asGridCoord(2, 1)]: true,  //Top wall
        [utils.asGridCoord(3, 1)]: true,  //Top wall
        [utils.asGridCoord(4, 1)]: true,  //Top wall
        [utils.asGridCoord(5, 1)]: true,  //Top wall
        [utils.asGridCoord(6, 1)]: true,  //Top wall
        [utils.asGridCoord(7, 1)]: true,  //Top wall
        [utils.asGridCoord(8, 1)]: true,  //Top wall
        [utils.asGridCoord(9, 1)]: true,  //Top wall
        [utils.asGridCoord(10, 1)]: true, //Top wall
        [utils.asGridCoord(11, 1)]: true, //Top wall
        [utils.asGridCoord(12, 1)]: true, //Top wall 
        [utils.asGridCoord(13, 1)]: true, //Top wall
        [utils.asGridCoord(13, 1)]: true, //Top wall
        [utils.asGridCoord(14, 1)]: true, //Top wall
        [utils.asGridCoord(15, 1)]: true, //Top wall
        [utils.asGridCoord(16, 1)]: true, //Top wall
        [utils.asGridCoord(17, 1)]: true, //Top wall
        [utils.asGridCoord(18, 1)]: true, //Top wall
        [utils.asGridCoord(19, 1)]: true, //Top wall
        [utils.asGridCoord(20, 1)]: true, //Top wall
        [utils.asGridCoord(21, 1)]: true, //Top wall
        [utils.asGridCoord(22, 1)]: true, //Top wall
        [utils.asGridCoord(23, 1)]: true, //Top wall
        [utils.asGridCoord(24, 1)]: true, //Top wall
        [utils.asGridCoord(25, 1)]: true, //Top wall
        [utils.asGridCoord(26, 1)]: true, //Top wall
        [utils.asGridCoord(27, 1)]: true, //Top wall
        [utils.asGridCoord(28, 1)]: true, //Top wall
        [utils.asGridCoord(29, 1)]: true, //Top wall
        [utils.asGridCoord(30, 1)]: true, //Top wall
        [utils.asGridCoord(31, 1)]: true, //Top wall
        [utils.asGridCoord(32, 1)]: true, //Top wall
        [utils.asGridCoord(33, 1)]: true, //Top wall
        [utils.asGridCoord(34, 1)]: true, //Top wall
        [utils.asGridCoord(35, 1)]: true, //Top wall
        [utils.asGridCoord(36, 1)]: true, //Top wall
        [utils.asGridCoord(37, 1)]: true, //Top wall
        [utils.asGridCoord(38, 1)]: true, //Top wall
        [utils.asGridCoord(39, 1)]: true, //Top wall
        [utils.asGridCoord(40, 1)]: true, //Top wall
        [utils.asGridCoord(41, 1)]: true, //Top wall 
        [utils.asGridCoord(42, 1)]: true, //Top wall
        [utils.asGridCoord(43, 1)]: true, //Top wall
        [utils.asGridCoord(44, 1)]: true, //Top wall
        [utils.asGridCoord(45, 1)]: true, //Top wall
        [utils.asGridCoord(46, 1)]: true, //Top wall
        [utils.asGridCoord(47, 1)]: true, //Top wall
        [utils.asGridCoord(48, 1)]: true, //Top wall
        [utils.asGridCoord(49, 1)]: true, //Top wall

        //Glass Wall
        [utils.asGridCoord(0, 4)]: true,  //Glass wall
        [utils.asGridCoord(1, 4)]: true,  //Glass wall
        [utils.asGridCoord(2, 4)]: true,  //Glass wall before doorway
        [utils.asGridCoord(4, 4)]: true,  //Glass wall after doorway
        [utils.asGridCoord(5, 4)]: true,  //Glass wall
        [utils.asGridCoord(6, 4)]: true,  //Glass wall
        [utils.asGridCoord(7, 4)]: true,  //Glass wall
        [utils.asGridCoord(8, 4)]: true,  //Glass wall
        [utils.asGridCoord(9, 4)]: true,  //Glass wall
        [utils.asGridCoord(10, 4)]: true, //Glass wall
        [utils.asGridCoord(11, 4)]: true, //Glass wall
        [utils.asGridCoord(12, 4)]: true, //Glass wall 
        [utils.asGridCoord(13, 4)]: true, //Glass wall
        [utils.asGridCoord(13, 4)]: true, //Glass wall
        [utils.asGridCoord(14, 4)]: true, //Glass wall
        [utils.asGridCoord(15, 4)]: true, //Glass wall
        [utils.asGridCoord(16, 4)]: true, //Glass wall
        [utils.asGridCoord(17, 4)]: true, //Glass wall
        [utils.asGridCoord(18, 4)]: true, //Glass wall
        [utils.asGridCoord(19, 4)]: true, //Glass wall
        [utils.asGridCoord(20, 4)]: true, //Glass wall
        [utils.asGridCoord(21, 4)]: true, //Glass wall
        [utils.asGridCoord(22, 4)]: true, //Glass wall
        [utils.asGridCoord(23, 4)]: true, //Glass wall
        [utils.asGridCoord(24, 4)]: true, //Glass wall
        [utils.asGridCoord(25, 4)]: true, //Glass wall
        [utils.asGridCoord(26, 4)]: true, //Glass wall
        [utils.asGridCoord(27, 4)]: true, //Glass wall
        [utils.asGridCoord(28, 4)]: true, //Glass wall
        [utils.asGridCoord(29, 4)]: true, //Glass wall
        [utils.asGridCoord(30, 4)]: true, //Glass wall
        [utils.asGridCoord(31, 4)]: true, //Glass wall
        [utils.asGridCoord(32, 4)]: true, //Glass wall
        [utils.asGridCoord(33, 4)]: true, //Glass wall
        [utils.asGridCoord(34, 4)]: true, //Glass wall
        [utils.asGridCoord(35, 4)]: true, //Glass wall
        [utils.asGridCoord(36, 4)]: true, //Glass wall
        [utils.asGridCoord(37, 4)]: true, //Glass wall
        [utils.asGridCoord(38, 4)]: true, //Glass wall
        [utils.asGridCoord(39, 4)]: true, //Glass wall
        [utils.asGridCoord(40, 4)]: true, //Glass wall
        [utils.asGridCoord(41, 4)]: true, //Glass wall 
        [utils.asGridCoord(42, 4)]: true, //Glass wall
        [utils.asGridCoord(43, 4)]: true, //Glass wall
        [utils.asGridCoord(44, 4)]: true, //Glass wall
        [utils.asGridCoord(45, 4)]: true, //Glass wall before doorway
        [utils.asGridCoord(47, 4)]: true, //Glass wall after doorway
        [utils.asGridCoord(48, 4)]: true, //Glass wall
        [utils.asGridCoord(49, 4)]: true, //Glass wall

        //Bottom Wall
        [utils.asGridCoord(0, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(1, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(2, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(3, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(4, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(5, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(6, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(7, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(8, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(9, 27)]: true,   //Bottom Wall
        [utils.asGridCoord(10, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(11, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(12, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(13, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(14, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(15, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(16, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(17, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(18, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(19, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(20, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(21, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(22, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(23, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(24, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(25, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(26, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(27, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(28, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(29, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(30, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(31, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(32, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(33, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(34, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(35, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(36, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(37, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(38, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(39, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(40, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(41, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(42, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(43, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(44, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(45, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(46, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(47, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(48, 27)]: true,  //Bottom Wall
        [utils.asGridCoord(49, 27)]: true,  //Bottom Wall

        //Desks
        [utils.asGridCoord(3, 18)]: true,   //left-left desk
        [utils.asGridCoord(4, 18)]: true,   //left-left desk
        [utils.asGridCoord(5, 18)]: true,   //left-left desk
        [utils.asGridCoord(10, 18)]: true,  //left-right desk
        [utils.asGridCoord(11, 18)]: true,  //left-right desk
        [utils.asGridCoord(12, 18)]: true,  //left-right desk
        [utils.asGridCoord(17, 18)]: true,  //middle-right desk
        [utils.asGridCoord(18, 18)]: true,  //middle-right desk
        [utils.asGridCoord(19, 18)]: true,  //middle-right desk
        [utils.asGridCoord(24, 18)]: true,  //middle-left desk
        [utils.asGridCoord(25, 18)]: true,  //middle-left desk
        [utils.asGridCoord(26, 18)]: true,  //middle-left desk
        [utils.asGridCoord(31, 18)]: true,  //right-left desk
        [utils.asGridCoord(32, 18)]: true,  //right-left desk
        [utils.asGridCoord(33, 18)]: true,  //right-left desk
        [utils.asGridCoord(38, 18)]: true,  //right-right desk
        [utils.asGridCoord(39, 18)]: true,  //right-right desk
        [utils.asGridCoord(40, 18)]: true,  //right-right desk

        //Left Dividing Wall
        [utils.asGridCoord(0, 18)]: true, //left wall
        [utils.asGridCoord(1, 18)]: true, //middle
        [utils.asGridCoord(1, 19)]: true, //middle
        [utils.asGridCoord(1, 20)]: true, //middle
        [utils.asGridCoord(1, 21)]: true, //middle
        [utils.asGridCoord(1, 22)]: true, //middle
        [utils.asGridCoord(1, 23)]: true, //middle
        [utils.asGridCoord(1, 24)]: true, //middle
        [utils.asGridCoord(1, 25)]: true, //middle
        [utils.asGridCoord(1, 26)]: true, //middle
        [utils.asGridCoord(1, 27)]: true, //middle
        [utils.asGridCoord(2, 18)]: true, //right wall

        //Middle-Left Dividing Wall
        [utils.asGridCoord(13, 18)]: true, //left wall
        [utils.asGridCoord(16, 18)]: true, //right wall
        [utils.asGridCoord(13, 18)]: true,
        [utils.asGridCoord(14, 18)]: true,
        [utils.asGridCoord(14, 19)]: true,
        [utils.asGridCoord(14, 20)]: true,
        [utils.asGridCoord(14, 21)]: true,
        [utils.asGridCoord(14, 22)]: true,
        [utils.asGridCoord(14, 23)]: true,
        [utils.asGridCoord(14, 24)]: true,
        [utils.asGridCoord(14, 25)]: true,
        [utils.asGridCoord(14, 26)]: true,
        [utils.asGridCoord(14, 27)]: true,
        [utils.asGridCoord(15, 18)]: true,
        [utils.asGridCoord(15, 19)]: true,
        [utils.asGridCoord(15, 20)]: true,
        [utils.asGridCoord(15, 21)]: true,
        [utils.asGridCoord(15, 22)]: true,
        [utils.asGridCoord(15, 23)]: true,
        [utils.asGridCoord(15, 24)]: true,
        [utils.asGridCoord(15, 25)]: true,
        [utils.asGridCoord(15, 26)]: true,
        [utils.asGridCoord(15, 27)]: true,

        //Middle-Right Dividing Wall
        [utils.asGridCoord(27, 18)]: true, //left wall
        [utils.asGridCoord(30, 18)]: true, //right wall
        [utils.asGridCoord(28, 18)]: true,
        [utils.asGridCoord(28, 19)]: true,
        [utils.asGridCoord(28, 20)]: true,
        [utils.asGridCoord(28, 21)]: true,
        [utils.asGridCoord(28, 22)]: true,
        [utils.asGridCoord(28, 23)]: true,
        [utils.asGridCoord(28, 24)]: true,
        [utils.asGridCoord(28, 25)]: true,
        [utils.asGridCoord(28, 26)]: true,
        [utils.asGridCoord(28, 27)]: true,
        [utils.asGridCoord(29, 18)]: true,
        [utils.asGridCoord(29, 19)]: true,
        [utils.asGridCoord(29, 20)]: true,
        [utils.asGridCoord(29, 21)]: true,
        [utils.asGridCoord(29, 22)]: true,
        [utils.asGridCoord(29, 23)]: true,
        [utils.asGridCoord(29, 24)]: true,
        [utils.asGridCoord(29, 25)]: true,
        [utils.asGridCoord(29, 26)]: true,
        [utils.asGridCoord(29, 27)]: true,

        //Right Dividing Wall
        [utils.asGridCoord(41, 18)]: true, //left wall
        [utils.asGridCoord(42, 18)]: true,
        [utils.asGridCoord(42, 19)]: true,
        [utils.asGridCoord(42, 20)]: true,
        [utils.asGridCoord(42, 21)]: true,
        [utils.asGridCoord(42, 22)]: true,
        [utils.asGridCoord(42, 23)]: true,
        [utils.asGridCoord(42, 24)]: true,
        [utils.asGridCoord(42, 25)]: true,
        [utils.asGridCoord(42, 26)]: true,
        [utils.asGridCoord(42, 27)]: true,
        [utils.asGridCoord(43, 18)]: true,
        [utils.asGridCoord(43, 19)]: true,
        [utils.asGridCoord(43, 20)]: true,
        [utils.asGridCoord(43, 21)]: true,
        [utils.asGridCoord(43, 22)]: true,
        [utils.asGridCoord(43, 23)]: true,
        [utils.asGridCoord(43, 24)]: true,
        [utils.asGridCoord(43, 25)]: true,
        [utils.asGridCoord(43, 26)]: true,
        [utils.asGridCoord(43, 27)]: true,

        //BuildRoom Wall
        [utils.asGridCoord(8, 11)]:   true,
        [utils.asGridCoord(9, 11)]:   true,
        [utils.asGridCoord(10, 11)]:  true,
        [utils.asGridCoord(11, 11)]:  true,
        [utils.asGridCoord(12, 11)]:  true,
        [utils.asGridCoord(13, 11)]:  true,
        [utils.asGridCoord(14, 11)]:  true,
        [utils.asGridCoord(15, 11)]:  true,
        [utils.asGridCoord(16, 11)]:  true,
        [utils.asGridCoord(17, 11)]:  true,
        [utils.asGridCoord(18, 11)]:  true,
        [utils.asGridCoord(19, 11)]:  true,
        [utils.asGridCoord(20, 11)]:  true,
        [utils.asGridCoord(21, 11)]:  true,
        [utils.asGridCoord(22, 11)]:  true,
        [utils.asGridCoord(23, 11)]:  true,
        [utils.asGridCoord(24, 11)]:  true,
        [utils.asGridCoord(25, 11)]:  true,
        [utils.asGridCoord(26, 11)]:  true,
        [utils.asGridCoord(27, 11)]:  true,
        [utils.asGridCoord(28, 11)]:  true,
        [utils.asGridCoord(29, 11)]:  true,
        [utils.asGridCoord(30, 11)]:  true,
        [utils.asGridCoord(31, 11)]:  true,
        [utils.asGridCoord(32, 11)]:  true,
        [utils.asGridCoord(33, 11)]:  true,
        [utils.asGridCoord(34, 11)]:  true,
        [utils.asGridCoord(35, 11)]:  true,
        [utils.asGridCoord(36, 11)]:  true,
        [utils.asGridCoord(37, 11)]:  true,
        [utils.asGridCoord(38, 11)]:  true,
        [utils.asGridCoord(39, 11)]:  true,
        [utils.asGridCoord(40, 11)]:  true,
        [utils.asGridCoord(41, 11)]:  true,
        [utils.asGridCoord(42, 11)]:  true,
        [utils.asGridCoord(8, 12)]:   true,
        [utils.asGridCoord(8, 13)]:   true,
        [utils.asGridCoord(9, 13)]:   true,    
        [utils.asGridCoord(10, 13)]:  true,    
        [utils.asGridCoord(11, 13)]:  true,    
        [utils.asGridCoord(12, 13)]:  true,
        [utils.asGridCoord(13, 13)]:  true,
        [utils.asGridCoord(14, 13)]:  true,    
        [utils.asGridCoord(15, 13)]:  true,    
        [utils.asGridCoord(16, 13)]:  true,    
        [utils.asGridCoord(17, 13)]:  true,
        [utils.asGridCoord(18, 13)]:  true,
        [utils.asGridCoord(19, 13)]:  true,    
        [utils.asGridCoord(20, 13)]:  true,    
        [utils.asGridCoord(21, 13)]:  true,    
        [utils.asGridCoord(22, 13)]:  true, 
        [utils.asGridCoord(23, 13)]:  true,
        [utils.asGridCoord(24, 13)]:  true,    
        [utils.asGridCoord(25, 13)]:  true,    
        [utils.asGridCoord(26, 13)]:  true,    
        [utils.asGridCoord(27, 13)]:  true,
        [utils.asGridCoord(28, 13)]:  true,
        [utils.asGridCoord(29, 13)]:  true,    
        [utils.asGridCoord(30, 13)]:  true,    
        [utils.asGridCoord(31, 13)]:  true,    
        [utils.asGridCoord(32, 13)]:  true,
        [utils.asGridCoord(33, 13)]:  true,
        [utils.asGridCoord(34, 13)]:  true,    
        [utils.asGridCoord(35, 13)]:  true,    
        [utils.asGridCoord(36, 13)]:  true,    
        [utils.asGridCoord(37, 13)]:  true,
        [utils.asGridCoord(38, 13)]:  true,
        [utils.asGridCoord(39, 13)]:  true,    
        [utils.asGridCoord(40, 13)]:  true,    
        [utils.asGridCoord(41, 13)]:  true,    
        [utils.asGridCoord(42, 13)]:  true,
        [utils.asGridCoord(42, 12)]:  true, 
      }
    },
    cutsceneSpaces: {

    },
  }
