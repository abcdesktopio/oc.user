import asyncio
import json
import uinput
import websockets

# define AXIS and BUTTON
events = (
    uinput.ABS_X + (0, 255, 0, 0),
    uinput.ABS_Y + (0, 255, 0, 0),
    uinput.ABS_RX + (0, 255, 0, 0),
    uinput.ABS_RY + (0, 255, 0, 0),
    uinput.ABS_HAT0X + (-1, 1, 0, 0),
    uinput.ABS_HAT0Y + (-1, 1, 0, 0),
    uinput.BTN_A,
    uinput.BTN_B,
    uinput.BTN_X,
    uinput.BTN_Y,
    uinput.BTN_TL,
    uinput.BTN_TR,
    uinput.BTN_SELECT,
    uinput.BTN_START,
    uinput.BTN_THUMBL,
    uinput.BTN_THUMBR,
)

device = uinput.Device(events, name="VirtualGamepad")

clients = set()

# Mapping buttons and axis X,Y
axis_map = {
    "x": uinput.ABS_X,
    "y": uinput.ABS_Y,
    "rx": uinput.ABS_RX,
    "ry": uinput.ABS_RY,
    "hatx": uinput.ABS_HAT0X,
    "haty": uinput.ABS_HAT0Y,
}

button_map = {
    "a": uinput.BTN_A,
    "b": uinput.BTN_B,
    "x": uinput.BTN_X,
    "y": uinput.BTN_Y,
    "tl": uinput.BTN_TL,
    "tr": uinput.BTN_TR,
    "select": uinput.BTN_SELECT,
    "start": uinput.BTN_START,
    "thumbl": uinput.BTN_THUMBL,
    "thumbr": uinput.BTN_THUMBR,
}

async def handle_client(websocket, path):
    clients.add(websocket)
    print(f"Client connected : {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data["type"] == "axis":
                    axis = data["axis"].lower()
                    value = int(data["value"])
                    if axis in axis_map:
                        device.emit(axis_map[axis], value, syn=True)
                elif data["type"] == "button":
                    btn = data["button"].lower()
                    value = int(data["value"])
                    if btn in button_map:
                        device.emit(button_map[btn], value, syn=True)
            except Exception as e:
                print(f"Error data message: {e}")
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected : {websocket.remote_address}")
    finally:
        clients.remove(websocket)

async def main():
    server = await websockets.serve(handle_client, "0.0.0.0", 29790)
    print("WebSocket server running on ws://0.0.0.0:29790")
    await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

