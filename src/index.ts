import { content, keystore } from '@xmtp/proto'
import { EventEmitter, NativeModulesProxy } from 'expo-modules-core'

import { Client } from '.'
import { ConversationContext } from './XMTP.types'
import XMTPModule from './XMTPModule'
import { ConsentListEntry, ConsentState } from './lib/ConsentListEntry'
import {
  ContentCodec,
  DecryptedLocalAttachment,
  EncryptedLocalAttachment,
  PreparedLocalMessage,
} from './lib/ContentCodec'
import { Conversation } from './lib/Conversation'
import {
  ConversationContainer,
  ConversationVersion,
} from './lib/ConversationContainer'
import { DecodedMessage } from './lib/DecodedMessage'
import { Group } from './lib/Group'
import type { Query } from './lib/Query'
import { ConversationSendPayload } from './lib/types'
import { DefaultContentTypes } from './lib/types/DefaultContentType'
import { getAddress } from './utils/address'

export * from './context'
export * from './hooks'
export { GroupChangeCodec } from './lib/NativeCodecs/GroupChangeCodec'
export { ReactionCodec } from './lib/NativeCodecs/ReactionCodec'
export { ReadReceiptCodec } from './lib/NativeCodecs/ReadReceiptCodec'
export { RemoteAttachmentCodec } from './lib/NativeCodecs/RemoteAttachmentCodec'
export { ReplyCodec } from './lib/NativeCodecs/ReplyCodec'
export { StaticAttachmentCodec } from './lib/NativeCodecs/StaticAttachmentCodec'
export { TextCodec } from './lib/NativeCodecs/TextCodec'
export * from './lib/Signer'

const EncodedContent = content.EncodedContent

export function address(): string {
  return XMTPModule.address()
}

export async function deleteLocalDatabase(address: string) {
  return XMTPModule.deleteLocalDatabase(address)
}

export async function auth(
  address: string,
  environment: 'local' | 'dev' | 'production',
  appVersion?: string | undefined,
  hasCreateIdentityCallback?: boolean | undefined,
  hasEnableIdentityCallback?: boolean | undefined,
  enableAlphaMls?: boolean | undefined,
  dbEncryptionKey?: Uint8Array | undefined,
  dbPath?: string | undefined
) {
  return await XMTPModule.auth(
    address,
    environment,
    appVersion,
    hasCreateIdentityCallback,
    hasEnableIdentityCallback,
    enableAlphaMls,
    dbEncryptionKey ? Array.from(dbEncryptionKey) : undefined,
    dbPath
  )
}

export async function receiveSignature(requestID: string, signature: string) {
  return await XMTPModule.receiveSignature(requestID, signature)
}

export async function createRandom(
  environment: 'local' | 'dev' | 'production',
  appVersion?: string | undefined,
  hasCreateIdentityCallback?: boolean | undefined,
  hasEnableIdentityCallback?: boolean | undefined,
  enableAlphaMls?: boolean | undefined,
  dbEncryptionKey?: Uint8Array | undefined,
  dbPath?: string | undefined
): Promise<string> {
  return await XMTPModule.createRandom(
    environment,
    appVersion,
    hasCreateIdentityCallback,
    hasEnableIdentityCallback,
    enableAlphaMls,
    dbEncryptionKey ? Array.from(dbEncryptionKey) : undefined,
    dbPath
  )
}

export async function createFromKeyBundle(
  keyBundle: string,
  environment: 'local' | 'dev' | 'production',
  appVersion?: string | undefined,
  enableAlphaMls?: boolean | undefined,
  dbEncryptionKey?: Uint8Array | undefined,
  dbPath?: string | undefined
): Promise<string> {
  return await XMTPModule.createFromKeyBundle(
    keyBundle,
    environment,
    appVersion,
    enableAlphaMls,
    dbEncryptionKey ? Array.from(dbEncryptionKey) : undefined,
    dbPath
  )
}

export async function createGroup<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  peerAddresses: string[],
  permissionLevel: 'everyone_admin' | 'creator_admin' = 'everyone_admin'
): Promise<Group<ContentTypes>> {
  return new Group(
    client,
    JSON.parse(
      await XMTPModule.createGroup(
        client.address,
        peerAddresses,
        permissionLevel
      )
    )
  )
}

export async function listGroups<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(client: Client<ContentTypes>): Promise<Group<ContentTypes>[]> {
  return (await XMTPModule.listGroups(client.address)).map((json: string) => {
    return new Group(client, JSON.parse(json))
  })
}

export async function listMemberAddresses<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(client: Client<ContentTypes>, id: string): Promise<string[]> {
  return XMTPModule.listMemberAddresses(client.address, id)
}

export async function sendMessageToGroup(
  clientAddress: string,
  groupId: string,
  content: any
): Promise<string> {
  const contentJson = JSON.stringify(content)
  return await XMTPModule.sendMessageToGroup(
    clientAddress,
    groupId,
    contentJson
  )
}

export async function groupMessages<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  id: string,
  limit?: number | undefined,
  before?: number | Date | undefined,
  after?: number | Date | undefined,
  direction?:
    | 'SORT_DIRECTION_ASCENDING'
    | 'SORT_DIRECTION_DESCENDING'
    | undefined
): Promise<DecodedMessage<ContentTypes>[]> {
  const messages = await XMTPModule.groupMessages(
    client.address,
    id,
    limit,
    before,
    after,
    direction
  )
  return messages.map((json: string) => {
    return DecodedMessage.from(json, client)
  })
}

export async function syncGroups(clientAddress: string) {
  await XMTPModule.syncGroups(clientAddress)
}

export async function syncGroup(clientAddress: string, id: string) {
  await XMTPModule.syncGroup(clientAddress, id)
}

export async function subscribeToGroupMessages(
  clientAddress: string,
  id: string
) {
  return await XMTPModule.subscribeToGroupMessages(clientAddress, id)
}

export async function unsubscribeFromGroupMessages(
  clientAddress: string,
  id: string
) {
  return await XMTPModule.unsubscribeFromGroupMessages(clientAddress, id)
}

export async function addGroupMembers(
  clientAddress: string,
  id: string,
  addresses: string[]
): Promise<void> {
  return XMTPModule.addGroupMembers(clientAddress, id, addresses)
}

export async function removeGroupMembers(
  clientAddress: string,
  id: string,
  addresses: string[]
): Promise<void> {
  return XMTPModule.removeGroupMembers(clientAddress, id, addresses)
}

export async function sign(
  clientAddress: string,
  digest: Uint8Array,
  keyType: string,
  preKeyIndex: number = 0
): Promise<Uint8Array> {
  const signatureArray = await XMTPModule.sign(
    clientAddress,
    Array.from(digest),
    keyType,
    preKeyIndex
  )
  return new Uint8Array(signatureArray)
}

export async function exportPublicKeyBundle(
  clientAddress: string
): Promise<Uint8Array> {
  const publicBundleArray =
    await XMTPModule.exportPublicKeyBundle(clientAddress)
  return new Uint8Array(publicBundleArray)
}

export async function exportKeyBundle(clientAddress: string): Promise<string> {
  return await XMTPModule.exportKeyBundle(clientAddress)
}

export async function exportConversationTopicData(
  clientAddress: string,
  conversationTopic: string
): Promise<string> {
  return await XMTPModule.exportConversationTopicData(
    clientAddress,
    conversationTopic
  )
}

export async function getHmacKeys(
  clientAddress: string
): Promise<keystore.GetConversationHmacKeysResponse> {
  const hmacKeysArray = await XMTPModule.getHmacKeys(clientAddress)
  const array = new Uint8Array(hmacKeysArray)
  return keystore.GetConversationHmacKeysResponse.decode(array)
}

export async function importConversationTopicData<
  ContentTypes extends ContentCodec<unknown>[],
>(
  client: Client<ContentTypes>,
  topicData: string
): Promise<Conversation<ContentTypes>> {
  const json = await XMTPModule.importConversationTopicData(
    client.address,
    topicData
  )
  return new Conversation(client, JSON.parse(json))
}

export async function canMessage(
  clientAddress: string,
  peerAddress: string
): Promise<boolean> {
  return await XMTPModule.canMessage(clientAddress, getAddress(peerAddress))
}

export async function canGroupMessage(
  clientAddress: string,
  peerAddresses: string[]
): Promise<boolean> {
  return await XMTPModule.canGroupMessage(clientAddress, peerAddresses)
}

export async function staticCanMessage(
  peerAddress: string,
  environment: 'local' | 'dev' | 'production',
  appVersion?: string | undefined
): Promise<boolean> {
  return await XMTPModule.staticCanMessage(
    getAddress(peerAddress),
    environment,
    appVersion
  )
}

export async function encryptAttachment(
  clientAddress: string,
  file: DecryptedLocalAttachment
): Promise<EncryptedLocalAttachment> {
  const fileJson = JSON.stringify(file)
  const encryptedFileJson = await XMTPModule.encryptAttachment(
    clientAddress,
    fileJson
  )
  return JSON.parse(encryptedFileJson)
}

export async function decryptAttachment(
  clientAddress: string,
  encryptedFile: EncryptedLocalAttachment
): Promise<DecryptedLocalAttachment> {
  const encryptedFileJson = JSON.stringify(encryptedFile)
  const fileJson = await XMTPModule.decryptAttachment(
    clientAddress,
    encryptedFileJson
  )
  return JSON.parse(fileJson)
}

export async function listConversations<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(client: Client<ContentTypes>): Promise<Conversation<ContentTypes>[]> {
  return (await XMTPModule.listConversations(client.address)).map(
    (json: string) => {
      return new Conversation(client, JSON.parse(json))
    }
  )
}

export async function listAll<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>
): Promise<ConversationContainer<ContentTypes>[]> {
  const list = await XMTPModule.listAll(client.address)
  return list.map((json: string) => {
    const jsonObj = JSON.parse(json)
    if (jsonObj.version === ConversationVersion.GROUP) {
      return new Group(client, jsonObj)
    } else {
      return new Conversation(client, jsonObj)
    }
  })
}

export async function listMessages<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  conversationTopic: string,
  limit?: number | undefined,
  before?: number | Date | undefined,
  after?: number | Date | undefined,
  direction?:
    | 'SORT_DIRECTION_ASCENDING'
    | 'SORT_DIRECTION_DESCENDING'
    | undefined
): Promise<DecodedMessage<ContentTypes>[]> {
  const messages = await XMTPModule.loadMessages(
    client.address,
    conversationTopic,
    limit,
    typeof before === 'number' ? before : before?.getTime(),
    typeof after === 'number' ? after : after?.getTime(),
    direction || 'SORT_DIRECTION_DESCENDING'
  )

  return messages.map((json: string) => {
    return DecodedMessage.from(json, client)
  })
}

export async function listBatchMessages<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  queries: Query[]
): Promise<DecodedMessage<ContentTypes>[]> {
  const topics = queries.map((item) => {
    return JSON.stringify({
      limit: item.pageSize || 0,
      topic: item.contentTopic,
      after:
        (typeof item.startTime === 'number'
          ? item.startTime
          : item.startTime?.getTime()) || 0,
      before:
        (typeof item.endTime === 'number'
          ? item.endTime
          : item.endTime?.getTime()) || 0,
      direction: item.direction || 'SORT_DIRECTION_DESCENDING',
    })
  })
  const messages = await XMTPModule.loadBatchMessages(client.address, topics)

  return messages.map((json: string) => {
    return DecodedMessage.from(json, client)
  })
}

// TODO: support conversation ID
export async function createConversation<
  ContentTypes extends ContentCodec<any>[],
>(
  client: Client<ContentTypes>,
  peerAddress: string,
  context?: ConversationContext
): Promise<Conversation<ContentTypes>> {
  return new Conversation(
    client,
    JSON.parse(
      await XMTPModule.createConversation(
        client.address,
        getAddress(peerAddress),
        JSON.stringify(context || {})
      )
    )
  )
}

export async function sendWithContentType<T>(
  clientAddress: string,
  conversationTopic: string,
  content: T,
  codec: ContentCodec<T>
): Promise<string> {
  if ('contentKey' in codec) {
    const contentJson = JSON.stringify(content)
    return await XMTPModule.sendMessage(
      clientAddress,
      conversationTopic,
      contentJson
    )
  } else {
    const encodedContent = codec.encode(content)
    encodedContent.fallback = codec.fallback(content)
    const encodedContentData = EncodedContent.encode(encodedContent).finish()

    return await XMTPModule.sendEncodedContent(
      clientAddress,
      conversationTopic,
      Array.from(encodedContentData)
    )
  }
}

export async function sendMessage<
  SendContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  clientAddress: string,
  conversationTopic: string,
  content: ConversationSendPayload<SendContentTypes>
): Promise<string> {
  // TODO: consider eager validating of `MessageContent` here
  //       instead of waiting for native code to validate
  const contentJson = JSON.stringify(content)
  return await XMTPModule.sendMessage(
    clientAddress,
    conversationTopic,
    contentJson
  )
}

export async function prepareMessage<
  PrepareContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  clientAddress: string,
  conversationTopic: string,
  content: ConversationSendPayload<PrepareContentTypes>
): Promise<PreparedLocalMessage> {
  // TODO: consider eager validating of `MessageContent` here
  //       instead of waiting for native code to validate
  const contentJson = JSON.stringify(content)
  const preparedJson = await XMTPModule.prepareMessage(
    clientAddress,
    conversationTopic,
    contentJson
  )
  return JSON.parse(preparedJson)
}

export async function prepareMessageWithContentType<T>(
  clientAddress: string,
  conversationTopic: string,
  content: any,
  codec: ContentCodec<T>
): Promise<PreparedLocalMessage> {
  if ('contentKey' in codec) {
    return prepareMessage(clientAddress, conversationTopic, content)
  }
  const encodedContent = codec.encode(content)
  encodedContent.fallback = codec.fallback(content)
  const encodedContentData = EncodedContent.encode(encodedContent).finish()
  const preparedJson = await XMTPModule.prepareEncodedMessage(
    clientAddress,
    conversationTopic,
    Array.from(encodedContentData)
  )
  return JSON.parse(preparedJson)
}

export async function sendPreparedMessage(
  clientAddress: string,
  preparedLocalMessage: PreparedLocalMessage
): Promise<string> {
  const preparedLocalMessageJson = JSON.stringify(preparedLocalMessage)
  return await XMTPModule.sendPreparedMessage(
    clientAddress,
    preparedLocalMessageJson
  )
}

export function subscribeToConversations(clientAddress: string) {
  return XMTPModule.subscribeToConversations(clientAddress)
}

export function subscribeToAll(clientAddress: string) {
  return XMTPModule.subscribeToAll(clientAddress)
}

export function subscribeToGroups(clientAddress: string) {
  return XMTPModule.subscribeToGroups(clientAddress)
}

export function subscribeToAllMessages(
  clientAddress: string,
  includeGroups: boolean
) {
  return XMTPModule.subscribeToAllMessages(clientAddress, includeGroups)
}

export function subscribeToAllGroupMessages(clientAddress: string) {
  return XMTPModule.subscribeToAllGroupMessages(clientAddress)
}

export async function subscribeToMessages(
  clientAddress: string,
  topic: string
) {
  return await XMTPModule.subscribeToMessages(clientAddress, topic)
}

export function unsubscribeFromConversations(clientAddress: string) {
  return XMTPModule.unsubscribeFromConversations(clientAddress)
}

export function unsubscribeFromGroups(clientAddress: string) {
  return XMTPModule.unsubscribeFromGroups(clientAddress)
}

export function unsubscribeFromAllMessages(clientAddress: string) {
  return XMTPModule.unsubscribeFromAllMessages(clientAddress)
}

export function unsubscribeFromAllGroupMessages(clientAddress: string) {
  return XMTPModule.unsubscribeFromAllGroupMessages(clientAddress)
}

export async function unsubscribeFromMessages(
  clientAddress: string,
  topic: string
) {
  return await XMTPModule.unsubscribeFromMessages(clientAddress, topic)
}

export function registerPushToken(pushServer: string, token: string) {
  return XMTPModule.registerPushToken(pushServer, token)
}

export function subscribePushTopics(clientAddress: string, topics: string[]) {
  return XMTPModule.subscribePushTopics(clientAddress, topics)
}

export async function decodeMessage<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  clientAddress: string,
  topic: string,
  encryptedMessage: string
): Promise<DecodedMessage<ContentTypes>> {
  return JSON.parse(
    await XMTPModule.decodeMessage(clientAddress, topic, encryptedMessage)
  )
}

export async function conversationConsentState(
  clientAddress: string,
  conversationTopic: string
): Promise<ConsentState> {
  return await XMTPModule.conversationConsentState(
    clientAddress,
    conversationTopic
  )
}

export async function isAllowed(
  clientAddress: string,
  address: string
): Promise<boolean> {
  return await XMTPModule.isAllowed(clientAddress, address)
}

export async function isDenied(
  clientAddress: string,
  address: string
): Promise<boolean> {
  return await XMTPModule.isDenied(clientAddress, address)
}

export async function denyContacts(
  clientAddress: string,
  addresses: string[]
): Promise<void> {
  return await XMTPModule.denyContacts(clientAddress, addresses)
}

export async function allowContacts(
  clientAddress: string,
  addresses: string[]
): Promise<void> {
  return await XMTPModule.allowContacts(clientAddress, addresses)
}

export async function refreshConsentList(
  clientAddress: string
): Promise<ConsentListEntry[]> {
  const consentList = await XMTPModule.refreshConsentList(clientAddress)

  return consentList.map((json: string) => {
    return ConsentListEntry.from(json)
  })
}

export async function consentList(
  clientAddress: string
): Promise<ConsentListEntry[]> {
  const consentList = await XMTPModule.consentList(clientAddress)

  return consentList.map((json: string) => {
    return ConsentListEntry.from(json)
  })
}

export function preEnableIdentityCallbackCompleted() {
  XMTPModule.preEnableIdentityCallbackCompleted()
}

export function preCreateIdentityCallbackCompleted() {
  XMTPModule.preCreateIdentityCallbackCompleted()
}

export async function isGroupActive(
  clientAddress: string,
  id: string
): Promise<boolean> {
  return XMTPModule.isGroupActive(clientAddress, id)
}

export async function addedByAddress(
  clientAddress: string,
  id: string
): Promise<string> {
  return XMTPModule.addedByAddress(clientAddress, id)
}

export async function isGroupAdmin(
  clientAddress: string,
  id: string
): Promise<boolean> {
  return XMTPModule.isGroupAdmin(clientAddress, id)
}

export async function allowGroups(
  clientAddress: string,
  groupIds: string[]
): Promise<void> {
  return XMTPModule.allowGroups(clientAddress, groupIds)
}

export async function denyGroups(
  clientAddress: string,
  groupIds: string[]
): Promise<void> {
  return XMTPModule.denyGroups(clientAddress, groupIds)
}

export async function isGroupAllowed(
  clientAddress: string,
  groupId: string
): Promise<boolean> {
  return XMTPModule.isGroupAllowed(clientAddress, groupId)
}

export async function isGroupDenied(
  clientAddress: string,
  groupId: string
): Promise<boolean> {
  return XMTPModule.isGroupDenied(clientAddress, groupId)
}

export async function processGroupMessage<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  id: string,
  encryptedMessage: string
): Promise<DecodedMessage<ContentTypes>> {
  const json = XMTPModule.processGroupMessage(
    client.address,
    id,
    encryptedMessage
  )
  return DecodedMessage.from(json, client)
}

export async function processWelcomeMessage<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes,
>(
  client: Client<ContentTypes>,
  encryptedMessage: string
): Promise<Group<ContentTypes>> {
  const json = await XMTPModule.processWelcomeMessage(
    client.address,
    encryptedMessage
  )
  return new Group(client, JSON.parse(json))
}

export const emitter = new EventEmitter(XMTPModule ?? NativeModulesProxy.XMTP)

export * from './XMTP.types'
export { Client } from './lib/Client'
export * from './lib/ContentCodec'
export { Conversation } from './lib/Conversation'
export {
  ConversationContainer,
  ConversationVersion,
} from './lib/ConversationContainer'
export { Query } from './lib/Query'
export { XMTPPush } from './lib/XMTPPush'
export { ConsentListEntry, DecodedMessage }
export { Group } from './lib/Group'
