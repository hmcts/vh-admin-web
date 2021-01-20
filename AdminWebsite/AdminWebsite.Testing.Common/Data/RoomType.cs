namespace AdminWebsite.Testing.Common.Data
{
    public class RoomType
    {
        public static readonly RoomType WaitingRoom = new RoomType("WaitingRoom");
        public static readonly RoomType HearingRoom = new RoomType("HearingRoom");
        
        private RoomType(string value)
        {
            _value = value;
        }

        private readonly string _value;

        public override string ToString()
        {
            return _value;
        }
    }
}