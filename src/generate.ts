import { isRoomPlaceable } from "./collisions";
import { DUNGEON_HEIGHT_UNIT, DUNGEON_WIDTH_UNIT } from "./config";
import {
  Dimensions,
  GraphDungeon,
  GraphRoom,
  Position,
  Room,
  RoomId,
  RoomType,
} from "./types";
import { getRandomInt } from "./utils";

export function generateDungeon(dungeon: GraphDungeon): Room[] {
  const rooms = generateRooms(dungeon, [], "start");
  const normalized = normalizeRoomsPosition(rooms);

  return normalized;
}

function generateRooms(
  dungeon: GraphDungeon,
  rooms: Room[],
  roomId: RoomId
): Room[] {
  console.log(`Generating room "${roomId}"...`);

  // Make a copy of the rooms
  const updatedRooms = [...rooms];

  // Get the graph room
  const graphRoom = dungeon.rooms[roomId];

  // Place the room
  const room = placeRoom(updatedRooms, graphRoom);
  if (!room) {
    throw new Error(`Could not place room "${roomId}"`);
  }

  updatedRooms.push(room);

  // Iterate over all children
  for (let i = 0; i < graphRoom.children.length; i++) {
    const childGraphRoomId = graphRoom.children[i];
    const childRooms = generateRooms(dungeon, updatedRooms, childGraphRoomId);
    updatedRooms.push(...childRooms);
  }

  return updatedRooms;
}

function placeRoom(rooms: Room[], graphRoom: GraphRoom): Room | undefined {
  const parent = !!graphRoom.parent
    ? rooms.find((item) => item.id === graphRoom.parent)
    : undefined;

  // Direction
  for (let i = 0; i < 10; i++) {
    const direction = generateDirection();

    // Dimensions
    for (let j = 0; j < 10; j++) {
      const dimensions = generateRoomDimensions(graphRoom.type);

      // Distance
      for (let k = 0; k < 10; k++) {
        const distance = generateDistance();

        // Position
        for (let l = 0; l < 100; l++) {
          const position = generatePosition(
            parent,
            direction,
            dimensions,
            distance
          );

          const room: Room = {
            id: graphRoom.id,
            type: graphRoom.type,
            children: graphRoom.children,
            dimensions,
            position,
          };
          const placeable = isRoomPlaceable(room, rooms);
          if (placeable) {
            return room;
          }
        }
      }
    }
  }

  return undefined;
}

function generateDirection(): Position {
  return { x: 0, y: 1 };
}

function generateRoomDimensions(type: RoomType): Dimensions {
  switch (type) {
    case "start":
      return {
        width: getRandomInt(5, 6),
        height: getRandomInt(5, 6),
      };
    case "room":
      return {
        width: getRandomInt(8, 12),
        height: getRandomInt(8, 12),
      };
    case "end":
      return {
        width: getRandomInt(5, 7),
        height: getRandomInt(5, 7),
      };
  }
}

function generateDistance(): number {
  return getRandomInt(2, 4);
}

function generatePosition(
  parent: Room | undefined,
  direction: Position,
  dimensions: Dimensions,
  distance: number
): Position {
  if (!parent) {
    return {
      x: Math.floor(DUNGEON_WIDTH_UNIT / 2) - Math.floor(dimensions.width / 2),
      y:
        Math.floor(DUNGEON_HEIGHT_UNIT / 2) - Math.floor(dimensions.height / 2),
    };
  }

  return {
    x: 0,
    y: parent.position.y + parent.dimensions.height + distance,
  };
}

function normalizeRoomsPosition(rooms: Room[]): Room[] {
  let normalized = [...rooms];

  let lowestX = 0;
  let lowestY = 0;

  normalized.forEach((item) => {
    if (item.position.x < lowestX) {
      lowestX = item.position.x;
    }

    if (item.position.y < lowestY) {
      lowestY = item.position.y;
    }
  });

  if (lowestX < 0 || lowestY < 0) {
    normalized = normalized.map((item) => {
      const updated = { ...item };

      updated.position.x = item.position.x + Math.abs(lowestX);
      updated.position.y = item.position.y + Math.abs(lowestY);

      return updated;
    });
  }

  return normalized;
}
