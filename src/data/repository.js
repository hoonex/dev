import { getSupabase } from "../lib/supabase.js";
import { localDateKey, randomRoomCode } from "../utils.js";

const DEMO_KEY = "study-room-demo-v1";

function demoSeed() {
  const now = new Date().toISOString();
  const today = localDateKey();
  return {
    profile: { id: "demo-me", display_name: "나", avatar_seed: "forest" },
    rooms: [{ id: "demo-room", name: "저녁 자습실", code: "STUDY7", owner_id: "demo-me" }],
    members: {
      "demo-room": [
        { user_id: "demo-me", display_name: "나", avatar_seed: "forest", role: "owner" },
        { user_id: "demo-jisu", display_name: "지수", avatar_seed: "sun", role: "member" },
        { user_id: "demo-min", display_name: "민재", avatar_seed: "blue", role: "member" }
      ]
    },
    statuses: {
      "demo-room": [
        { user_id: "demo-me", status: "resting", status_message: "수학 시작 전", since_at: now, updated_at: now },
        { user_id: "demo-jisu", status: "studying", status_message: "영어 독해", since_at: new Date(Date.now() - 23 * 60000).toISOString(), updated_at: now },
        { user_id: "demo-min", status: "resting", status_message: "10분 쉬는 중", since_at: new Date(Date.now() - 6 * 60000).toISOString(), updated_at: now }
      ]
    },
    tasks: [
      { id: "task-1", room_id: "demo-room", user_id: "demo-me", task_date: today, title: "수학 미적분 문제 20개", completed: false, sort_order: 0 },
      { id: "task-2", room_id: "demo-room", user_id: "demo-me", task_date: today, title: "영어 단어 25개", completed: true, sort_order: 1 },
      { id: "task-3", room_id: "demo-room", user_id: "demo-jisu", task_date: today, title: "영어 지문 3개", completed: false, sort_order: 0 },
      { id: "task-4", room_id: "demo-room", user_id: "demo-min", task_date: today, title: "화학 오답 정리", completed: false, sort_order: 0 }
    ],
    sessions: [
      { id: "s1", room_id: "demo-room", user_id: "demo-me", started_at: new Date(Date.now() - 86400000).toISOString(), duration_seconds: 3100 },
      { id: "s2", room_id: "demo-room", user_id: "demo-me", started_at: new Date(Date.now() - 2 * 86400000).toISOString(), duration_seconds: 4200 }
    ]
  };
}

class DemoRepository {
  constructor() {
    this.listeners = new Set();
    this.data = JSON.parse(localStorage.getItem(DEMO_KEY) || "null") || demoSeed();
    this.persist();
  }

  persist() {
    localStorage.setItem(DEMO_KEY, JSON.stringify(this.data));
    this.listeners.forEach((listener) => listener());
  }

  async getSession() {
    return { user: { id: this.data.profile.id, email: "preview@local" }, demo: true };
  }

  onAuthChange() { return () => {}; }
  async signInWithGoogle() { return { demo: true }; }
  async signInWithEmail() { return { demo: true }; }
  async signOut() { return; }
  async getProfile() { return this.data.profile; }

  async updateProfile(displayName) {
    this.data.profile.display_name = displayName.trim() || "나";
    const me = Object.values(this.data.members).flat().find((member) => member.user_id === this.data.profile.id);
    if (me) me.display_name = this.data.profile.display_name;
    this.persist();
    return this.data.profile;
  }

  async listRooms() { return this.data.rooms; }

  async createRoom(name) {
    const room = { id: crypto.randomUUID(), name: name.trim() || "우리 공부방", code: randomRoomCode(), owner_id: this.data.profile.id };
    this.data.rooms.push(room);
    this.data.members[room.id] = [{ user_id: this.data.profile.id, display_name: this.data.profile.display_name, avatar_seed: "forest", role: "owner" }];
    this.data.statuses[room.id] = [{ user_id: this.data.profile.id, status: "resting", status_message: "준비 중", since_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
    this.persist();
    return room;
  }

  async joinRoom(code) {
    const room = this.data.rooms.find((item) => item.code === code);
    if (!room) throw new Error("해당 코드의 방을 찾지 못했어요.");
    return room;
  }

  async getRoomState(roomId) {
    const room = this.data.rooms.find((item) => item.id === roomId);
    const members = this.data.members[roomId] || [];
    const statuses = this.data.statuses[roomId] || [];
    const today = localDateKey();
    const tasks = this.data.tasks.filter((task) => task.room_id === roomId && task.task_date === today);
    return { room, members, statuses, tasks };
  }

  async addTask(roomId, title) {
    const task = {
      id: crypto.randomUUID(), room_id: roomId, user_id: this.data.profile.id,
      task_date: localDateKey(), title: title.trim(), completed: false,
      sort_order: this.data.tasks.filter((item) => item.room_id === roomId && item.user_id === this.data.profile.id).length
    };
    this.data.tasks.push(task);
    this.persist();
    return task;
  }

  async setTaskCompleted(taskId, completed) {
    const task = this.data.tasks.find((item) => item.id === taskId && item.user_id === this.data.profile.id);
    if (task) task.completed = completed;
    this.persist();
  }

  async deleteTask(taskId) {
    this.data.tasks = this.data.tasks.filter((item) => !(item.id === taskId && item.user_id === this.data.profile.id));
    this.persist();
  }

  async setStatus(roomId, status, message = "") {
    const list = this.data.statuses[roomId] || (this.data.statuses[roomId] = []);
    let row = list.find((item) => item.user_id === this.data.profile.id);
    const now = new Date().toISOString();
    if (!row) {
      row = { user_id: this.data.profile.id, status, status_message: message, since_at: now, updated_at: now };
      list.push(row);
    } else {
      row.status = status;
      row.status_message = message;
      row.since_at = now;
      row.updated_at = now;
    }
    this.persist();
  }

  async recordFocus(roomId, startedAt, durationSeconds, taskId = null) {
    if (durationSeconds < 5) return;
    this.data.sessions.push({ id: crypto.randomUUID(), room_id: roomId, user_id: this.data.profile.id, started_at: startedAt, duration_seconds: durationSeconds, task_id: taskId });
    this.persist();
  }

  async getStats(roomId) {
    return this.data.sessions.filter((session) => session.room_id === roomId && session.user_id === this.data.profile.id);
  }

  subscribeRoom(_roomId, callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

class SupabaseRepository {
  constructor(client) {
    this.client = client;
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthChange(callback) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  }

  async signInWithGoogle() {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
  }

  async signInWithEmail(email) {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getProfile() {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) return null;
    const { data, error } = await this.client.from("profiles").select("id, display_name, avatar_seed").eq("id", user.id).single();
    if (error) throw error;
    return data;
  }

  async updateProfile(displayName) {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error("로그인이 필요해요.");
    const { data, error } = await this.client.from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id)
      .select("id, display_name, avatar_seed")
      .single();
    if (error) throw error;
    return data;
  }

  async listRooms() {
    const { data, error } = await this.client.from("room_members")
      .select("room_id, role, rooms(id,name,code,owner_id,created_at)")
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => row.rooms).filter(Boolean);
  }

  async createRoom(name) {
    const { data, error } = await this.client.rpc("create_study_room", { room_name: name.trim() || "우리 공부방" });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async joinRoom(code) {
    const { data, error } = await this.client.rpc("join_study_room", { room_code: code });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async getRoomState(roomId) {
    const today = localDateKey();
    const [roomRes, membersRes, statusesRes, tasksRes] = await Promise.all([
      this.client.from("rooms").select("id,name,code,owner_id,created_at").eq("id", roomId).single(),
      this.client.from("room_members").select("user_id,role,joined_at,profiles(display_name,avatar_seed)").eq("room_id", roomId).order("joined_at"),
      this.client.from("study_status").select("user_id,status,status_message,since_at,updated_at").eq("room_id", roomId),
      this.client.from("daily_tasks").select("id,room_id,user_id,task_date,title,completed,sort_order,created_at").eq("room_id", roomId).eq("task_date", today).order("sort_order")
    ]);
    const error = roomRes.error || membersRes.error || statusesRes.error || tasksRes.error;
    if (error) throw error;
    return {
      room: roomRes.data,
      members: (membersRes.data || []).map((row) => ({ user_id: row.user_id, role: row.role, ...row.profiles })),
      statuses: statusesRes.data || [],
      tasks: tasksRes.data || []
    };
  }

  async addTask(roomId, title) {
    const { data: { user } } = await this.client.auth.getUser();
    const { data, error } = await this.client.from("daily_tasks")
      .insert({ room_id: roomId, user_id: user.id, task_date: localDateKey(), title: title.trim() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async setTaskCompleted(taskId, completed) {
    const { error } = await this.client.from("daily_tasks").update({ completed }).eq("id", taskId);
    if (error) throw error;
  }

  async deleteTask(taskId) {
    const { error } = await this.client.from("daily_tasks").delete().eq("id", taskId);
    if (error) throw error;
  }

  async setStatus(roomId, status, message = "") {
    const { data: { user } } = await this.client.auth.getUser();
    const now = new Date().toISOString();
    const { error } = await this.client.from("study_status").upsert({
      room_id: roomId, user_id: user.id, status, status_message: message.trim(), since_at: now, updated_at: now
    }, { onConflict: "room_id,user_id" });
    if (error) throw error;
  }

  async recordFocus(roomId, startedAt, durationSeconds, taskId = null) {
    if (durationSeconds < 5) return;
    const { data: { user } } = await this.client.auth.getUser();
    const endedAt = new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();
    const { error } = await this.client.from("focus_sessions").insert({
      room_id: roomId, user_id: user.id, task_id: taskId, started_at: startedAt, ended_at: endedAt, duration_seconds: durationSeconds
    });
    if (error) throw error;
  }

  async getStats(roomId) {
    const { data: { user } } = await this.client.auth.getUser();
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const { data, error } = await this.client.from("focus_sessions")
      .select("id,started_at,duration_seconds")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .gte("started_at", since.toISOString())
      .order("started_at");
    if (error) throw error;
    return data || [];
  }

  subscribeRoom(roomId, callback) {
    const channel = this.client.channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_status", filter: `room_id=eq.${roomId}` }, callback)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks", filter: `room_id=eq.${roomId}` }, callback)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, callback)
      .subscribe();
    return () => this.client.removeChannel(channel);
  }
}

export async function createRepository() {
  const client = await getSupabase();
  if (!client) return { repository: new DemoRepository(), demo: true };
  return { repository: new SupabaseRepository(client), demo: false };
}
