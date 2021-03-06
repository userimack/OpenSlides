from typing import Any

from ..utils.constants import get_constants
from ..utils.projector import get_projectot_data
from ..utils.websocket import (
    BaseWebsocketClientMessage,
    ProtocollAsyncJsonWebsocketConsumer,
    get_element_data,
)


class NotifyWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    Websocket message from a client to send a message to other clients.
    """

    identifier = "notify"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Notify elements.",
        "description": "Elements that one client can send to one or many other clients.",
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "projectors": {"type": "array", "items": {"type": "integer"}},
                "reply_channels": {"type": "array", "items": {"type": "string"}},
                "users": {"type": "array", "items": {"type": "integer"}},
            },
        },
        "minItems": 1,
    }

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        await consumer.channel_layer.group_send(
            "site",
            {
                "type": "send_notify",
                "incomming": content,
                "senderReplyChannelName": consumer.channel_name,
                "senderUserId": consumer.scope["user"]["id"],
            },
        )


class ConstantsWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client requests the constants.
    """

    identifier = "constants"
    content_required = False

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        # Return all constants to the client.
        await consumer.send_json(
            type="constants", content=get_constants(), in_response=id
        )


class GetElementsWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client request database elements.
    """

    identifier = "getElements"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "titel": "getElement request",
        "description": "Request from the client to server to get elements.",
        "type": "object",
        "properties": {
            # change_id is not required
            "change_id": {"type": "integer"}
        },
    }

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        requested_change_id = content.get("change_id", 0)
        try:
            element_data = await get_element_data(
                consumer.scope["user"]["id"], requested_change_id
            )
        except ValueError as error:
            await consumer.send_json(type="error", content=str(error), in_response=id)
        else:
            await consumer.send_json(
                type="autoupdate", content=element_data, in_response=id
            )


class AutoupdateWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client turns autoupdate on or off.
    """

    identifier = "autoupdate"

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        # Turn on or off the autoupdate for the client
        if content:  # accept any value, that can be interpreted as bool
            await consumer.channel_layer.group_add("autoupdate", consumer.channel_name)
        else:
            await consumer.channel_layer.group_discard(
                "autoupdate", consumer.channel_name
            )


class ListenToProjectors(BaseWebsocketClientMessage):
    """
    The client tells, to which projector it listens.

    Therefor it sends a list of projector ids. If it sends an empty list, it does
    not want to get any projector information.
    """

    identifier = "listenToProjectors"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "titel": "Listen to projectors",
        "description": "Listen to zero, one or more projectors..",
        "type": "object",
        "properties": {
            "projector_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "uniqueItems": True,
            }
        },
        "required": ["projector_ids"],
    }

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        consumer.listen_projector_ids = content["projector_ids"]
        if consumer.listen_projector_ids:
            # listen to projector group
            await consumer.channel_layer.group_add("projector", consumer.channel_name)
        else:
            # do not listen to projector group
            await consumer.channel_layer.group_discard(
                "projector", consumer.channel_name
            )

        # Send projector data
        if consumer.listen_projector_ids:
            projector_data = await get_projectot_data(consumer.listen_projector_ids)
            for projector_id, data in projector_data.items():
                consumer.projector_hash[projector_id] = hash(str(data))

            await consumer.send_json(
                type="projector", content=projector_data, in_response=id
            )
