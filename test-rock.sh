if [ x"$1" = "xunrock" ]; then
	echo '{"rock_state": "unrocked"}' > rock_unrock.fifo
else
	echo '{"rock_state": "rocked"}' > rock_unrock.fifo
fi

