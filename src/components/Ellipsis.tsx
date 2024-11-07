import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const Ellipsis: React.FC<{ suffixCount: number; children: string }> = ({suffixCount, children}) => {

	const start = children.slice(0, children.length - suffixCount).trim();
	const suffix = children.slice(-suffixCount).trim();

	return (
		<Text style={{ maxWidth: '100%' }} ellipsis={{ suffix }}>
			{start}
		</Text>
	);
};

export default Ellipsis;
